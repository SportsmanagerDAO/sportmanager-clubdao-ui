import React, { useContext, useState } from "react";
import Router from "next/router";
import AppContext from "../../context/AppContext";
import {
  Text,
  List,
  ListItem,
  Stack,
  HStack,
  Spacer,
  Checkbox,
  Link,
} from "@chakra-ui/react";
import {
  getNetworkName,
  convertVotingPeriod,
  fromDecimals,
} from "../../utils/formatters";
import { addresses } from "../../constants/addresses";
import { factoryInstance } from "../../eth/factory";
import { presets } from "../../constants/presets";
import DashedDivider from "../elements/DashedDivider";
import KaliButton from "../elements/KaliButton";
import ContactForm from "../elements/ContactForm";
import ToS from "../elements/ToS";
import { fetchTokens } from "../../utils/fetchTokens";
import { uploadDoc } from "../tools/UploadDoc";
import { pdf, BlobProvider } from "@react-pdf/renderer";
import fleek from "@fleekhq/fleek-storage-js";
import DelawareOAtemplate from "../legal/DelawareOAtemplate";
import DelawareInvestmentClubTemplate from "../legal/DelawareInvestmentClubTemplate";
import DelawareUNAtemplate from "../legal/DelawareUNAtemplate";
import WyomingOAtemplate from "../legal/WyomingOAtemplate";
import SwissVerein from "../legal/SwissVerein";

export default function Checkout({ details, daoNames }) {
  const value = useContext(AppContext);
  const { web3, chainId, loading, account } = value.state;
  const [disclaimers, setDisclaimers] = useState([false, false]);
  const [deployable, setDeployable] = useState(false);
  const [doc, setDoc] = useState("");
  const [docInputs, setDocInputs] = useState({})
  const [blobOn, setBlobOn] = useState(false);
  const [blob, setBlob] = useState("");

  const isNameUnique = (name) => {
    if (daoNames != null) {
      if (name != null && daoNames.includes(name) === true) {
        value.toast("Name not unique. Choose another.");
        return false;
      }
    }
  };

  const handleDisclaimer = (num) => {
    console.log(num);
    let disclaimers_ = disclaimers;
    disclaimers_[num] = !disclaimers_[num];
    setDisclaimers(disclaimers_);
    let deployable_ = true;
    if (details["legal"]["docType"] == 1) {
      for (let i = 0; i < disclaimers_.length; i++) {
        if (disclaimers_[i] == false) {
          deployable_ = false;
        }
      }
    } else {
      if (disclaimers_[num] === false) {
        deployable_ = false;
      }
    }
    console.log(disclaimers[num]);
    console.log(deployable_);
    setDeployable(deployable_);
  };

  // for use at the end
  let paused;
  if (details["governance"]["paused"] == 1) {
    paused = "restricted";
  } else {
    paused = "unrestricted";
  }

  let daoType;
  if (details["daoType"] == null) {
    daoType = "Custom";
  } else {
    daoType = presets[details["daoType"]]["type"];
  }

  let docs;
  if (details["legal"]["docs"] == "") {
    docs = "Ricardian";
  } else {
    docs = details["legal"]["docs"];
  }

  const construct = async () => {
    console.log(details["legal"]["docType"])
    const _blob
    switch (details["legal"]["docType"]) {
      case "1":
      case "2":
        _blob = await pdf(DelawareOAtemplate({name: "123", chain: "123"})).toBlob();
      case "3":
         _blob = await pdf(DelawareInvestmentClubTemplate({name: "123", chain: "123"})).toBlob();
        console.log("pdf from render", _blob)
      case "4":
        _blob = await pdf(WyomingOAtemplate({name: "123", chain: "123"})).toBlob();
      case "5":
        _blob = await pdf(DelawareUNAtemplate({name: "123", chain: "123"})).toBlob();
        case "6":
        _blob = await pdf(SwissVerein({name: "123", chain: "123"})).toBlob();
        case "7":
    }

    const input = {
      apiKey: process.env.NEXT_PUBLIC_FLEEK_API_KEY,
      apiSecret: process.env.NEXT_PUBLIC_FLEEK_API_SECRET,
      bucket: "f4a2a9f1-7442-4cf2-8b0e-106f14be163b-bucket",
      key: "new stuff",
      data: _blob,
      httpUploadProgressCallback: (event) => {
        console.log(Math.round((event.loaded / event.total) * 100) + "% done");
      },
    };

    try {
      const result = await fleek.upload(input);
      console.log("Image hash from Fleek: " + result.hash);
    } catch (e) {
      console.log(e);
    }
  };

  const deploy = async () => {
    construct()

    if (!web3 || web3 == null) {
      value.toast(errorMessages["connect"]);
      return;
    }

    value.setLoading(true);

    let factory;
    try {
      factory = factoryInstance(addresses[chainId]["factory"], web3);
    } catch (e) {
      value.toast(e);
    }

    const { daoName, symbol } = details["identity"];

    if (isNameUnique(daoName) == false) {
      value.setLoading(false);
      return;
    }

    const { votingPeriod, paused, quorum, supermajority } =
      details["governance"];

    const { docs } = details["legal"];
    console.log("docs to be pushed", docs);
    const { members, shares } = details["founders"];
    const { network, daoType } = details;
    const { tribute, redemption, crowdsale } = details["extensions"];
    console.log("tribute", tribute);

    const govSettings = Array(
      votingPeriod,
      0,
      quorum,
      supermajority,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1
    );

    let extensionsArray = new Array();
    let extensionsData = new Array();

    if (tribute["active"]) {
      extensionsArray.push(addresses[chainId]["extensions"]["tribute"]);
      extensionsData.push("0x");
    }

    if (crowdsale["active"]) {
      extensionsArray.push(addresses[chainId]["extensions"]["crowdsale"]);

      var {
        listId,
        purchaseToken,
        purchaseMultiplier,
        purchaseLimit,
        saleEnds,
        documentation,
      } = crowdsale;

      purchaseToken = presets[1]["extensions"]["crowdsale"]["purchaseToken"];
      purchaseMultiplier =
        presets[1]["extensions"]["crowdsale"]["purchaseMultiplier"];
      purchaseLimit = presets[1]["extensions"]["crowdsale"]["purchaseLimit"];

      console.log(
        "crowdsale param",
        listId,
        purchaseToken,
        purchaseMultiplier,
        purchaseLimit,
        saleEnds,
        documentation
      );

      // let now = parseInt(new Date().getTime() / 1000);
      saleEnds = parseInt(new Date(saleEnds).getTime() / 1000);

      console.log("saleEnds", saleEnds);
      const sale = require("../../abi/KaliDAOcrowdsale.json");

      (docs != null) ? documentation = docs : documentation = "none"

      const saleAddress = addresses[chainId]["extensions"]["crowdsale"];

      const saleContract = new web3.eth.Contract(sale, saleAddress);
      console.log(
        listId,
        purchaseToken,
        purchaseMultiplier,
        purchaseLimit,
        saleEnds,
        documentation
      );

      const encodedParams = web3.eth.abi.encodeParameters(
        ["uint256", "address", "uint8", "uint96", "uint32", "string"],
        [
          listId,
          purchaseToken,
          purchaseMultiplier,
          purchaseLimit,
          saleEnds,
          documentation,
        ]
      );

      let payload = saleContract.methods
        .setExtension(encodedParams)
        .encodeABI();

      extensionsData.push(payload);
    }

    if (redemption["active"]) {
      extensionsArray.push(addresses[chainId]["extensions"]["redemption"]);
      console.log(redemption);
      let { redemptionStart } = redemption;

      // getting token array
      let tokenArray = fetchTokens(chainId);
      console.log(tokenArray);

      // let now = parseInt(new Date().getTime() / 1000);
      redemptionStart = parseInt(new Date(redemptionStart).getTime() / 1000);
      console.log("redemption param", redemptionStart, tokenArray);

      const redemptionABI = require("../../abi/KaliDAOredemption.json");

      const redemptionAddress = addresses[chainId]["extensions"]["redemption"];

      const redemptionContract = new web3.eth.Contract(
        redemptionABI,
        redemptionAddress
      );

      const encodedParams = web3.eth.abi.encodeParameters(
        ["address[]", "uint256"],
        [tokenArray, redemptionStart]
      );

      let payload = redemptionContract.methods
        .setExtension(encodedParams)
        .encodeABI();

      extensionsData.push(payload);

      // loading token approval calls for redemptions
      const token = require("../../abi/ERC20.json");

      const amount = web3.utils.toWei("10000000", "ether");

      for (let i = 0; i < tokenArray.length; i++) {
        const tokenContract = new web3.eth.Contract(token, tokenArray[i]);
        let approvalPayload = tokenContract.methods
          .approve(redemptionAddress, amount)
          .encodeABI();

        extensionsArray.push(tokenArray[i]);
        extensionsData.push(approvalPayload);
      }
    }

    // console.log("extensionsArray", extensionsArray);
    // console.log("extensionsData", extensionsData);

    console.log(
      "deployment param",
      daoName,
      symbol,
      docs,
      paused,
      extensionsArray,
      extensionsData,
      members,
      shares,
      govSettings
    );

    var gasPrice_ = await web3.eth.getGasPrice();
    var BN = web3.utils.BN;
    let gasPrice = new BN(gasPrice_).toString();

    // try {
    //   let result = await factory.methods
    //     .deployKaliDAO(
    //       daoName,
    //       symbol,
    //       docs,
    //       paused,
    //       extensionsArray,
    //       extensionsData,
    //       members,
    //       shares,
    //       govSettings
    //     )
    //     .send({ from: account, gasPrice: gasPrice });

    //   let dao = result["events"]["DAOdeployed"]["returnValues"]["kaliDAO"];
    //   console.log(dao);
    //   console.log(result);

    //   Router.push({
    //     pathname: "/daos/[dao]",
    //     query: { dao: dao },
    //   });
    // } catch (e) {
    //   value.toast(e);
    //   console.log(e);
    // }

    value.setLoading(false);
  };

  const checkoutDetails = [
    {
      name: "Chain",
      details: getNetworkName(details["network"]).replace(/^\w/, (s) =>
        s.toUpperCase()
      ),
    },
    {
      name: "Name",
      details: details["identity"]["daoName"],
    },
    {
      name: "Symbol",
      details: details["identity"]["symbol"],
    },
    {
      name: "Type",
      details: daoType,
    },
    {
      name: "Members",
      details: details["founders"]["members"],
    },
    {
      name: "Voting period",
      details: convertVotingPeriod(details["governance"]["votingPeriod"]),
    },
    {
      name: "Share transferability",
      details: paused,
    },
    {
      name: "Quorum",
      details: details["governance"]["quorum"] + "%",
    },
    {
      name: "Supermajority",
      details: details["governance"]["supermajority"] + "%",
    },
    {
      name: "Docs",
      details: docs,
    },
  ];

  return (
    <>
      <Stack id="checkout">
        {checkoutDetails.map((item, index) => (
          <>
            {Array.isArray(item.details) ? ( // members array
              <>
                <Text>{item.name}</Text>
                <List>
                  {item.details.map((member, i) => (
                    <ListItem key={i}>
                      {member} (
                      {fromDecimals(details["founders"].shares[i], 18)} shares)
                    </ListItem>
                  ))}
                </List>
              </>
            ) : (
              <HStack>
                <Text>{item.name}</Text>
                <Spacer />
                <Text>{item.details}</Text>
              </HStack>
            )}
            <DashedDivider />
          </>
        ))}
      </Stack>
      <br></br>
      <Checkbox onChange={() => handleDisclaimer(0)}>
        I agree to the <ToS label="Terms of Service" id="tos" />
      </Checkbox>
      {details["legal"]["docType"] == 1 ? (
        <Checkbox onChange={() => handleDisclaimer(1)}>
          I agree to the{" "}
          <Link href="https://gateway.pinata.cloud/ipfs/QmdHFNxtecmCNcTscWJqnA4AiASyk3SHCgKamugLHqR23i">
            <i>Series LLC terms</i>
          </Link>
          .
        </Checkbox>
      ) : null}
      <br></br>

      <KaliButton id="deploy-btn" disabled={!deployable} onClick={deploy}>
        Deploy Your DAO!
      </KaliButton>
      <br></br>
      <HStack>
        <Text fontWeight={400}>
          {" "}
          <Link href="https://kalico.typeform.com/to/FNsxHBKX">
            <i>Need LLC Filing Help?</i>
          </Link>
        </Text>
      </HStack>
      <br></br>
      <HStack>
        <Text fontWeight={400}>Have questions?</Text>
        <ContactForm />
      </HStack>
      {/* {blobOn && (<BlobProvider document={<DelawareInvestmentClubTemplate name={docInputs.name}
                    chain={docInputs.chain}
                  />}>
      {({ blob, url, loading, error }) => {
        // Do whatever you need with blob here
        setBlob(blob)
        console.log("this is blobbbb", blob, docInputs.name, docInputs.chain)
        return 
      }}
      </BlobProvider>)} */}
    </>
  );
}
