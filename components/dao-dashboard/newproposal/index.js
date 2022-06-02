import { useState } from "react";
import { Flex, Button, Box } from "../../../styles/elements"
import { DialogTitle } from "../../../styles/Dialog";
import Tribute from "./apps/Tribute";
import Crowdsale from "./apps/Crowdsale";
import Redeem from "./apps/Redeem";
import SendErc20 from "./SendErc20";
import ManageMembership from "./ManageMembership";
import ConfigureGovernance from "./ConfigureGovernance";
import ConfigureExtensions from "./ConfigureExtensions";
import CallContract from "./CallContract";
import ProposalsMenu from "./ProposalsMenu";
import { DoubleArrowLeftIcon } from "@radix-ui/react-icons";
import SendMenu from "./SendMenu";
import SendEth from "./SendEth";
import MemberMenu from "./MemberMenu";
import GovMenu from "./GovMenu";
import AdminMenu from "./AdminMenu";
import ApplyMenu from "./ApplyMenu";
import Signal from "./signal";

export function NewProposalModal({ proposalProp }) {
  const [view, setView] = useState(proposalProp);

  const proposals = {
    // Main Menu
    menu: {
      title: "",
      component: <ProposalsMenu setProposal={setView} />,
    },
    // Sub Menu
    memberMenu: {
      title: "",
      component: <MemberMenu setProposal={setView} />,
    },
    sendMenu: {
      title: "",
      component: <SendMenu setProposal={setView} />,
    },
    govMenu: {
      title: "",
      component: <GovMenu setProposal={setView} />,
    },
    adminMenu: {
      title: "",
      component: <AdminMenu setProposal={setView} />,
    },
    applyMenu: {
      title: "",
      component: <ApplyMenu setProposal={setView} />,
    },
    // Membe Menu
    addMember: {
      title: "Add Member",
      component: <ManageMembership />
    },
    addMemberWithVesting: {
      title: "Add Member with Vesting",
      component: <ManageMembership />
    },
    removeMember: {
      title: "Remove Member",
      component: <ManageMembership />
    },
    quit: {
      title: "Redeem and Quit",
      component: <Redeem />,
    },
    // Send Menu
    eth: {
      title: "Send ETH",
      component: <SendEth />
    },    
    erc20: {
      title: "Send ERC20",
      component: <SendErc20 />
    },
    erc721: {
      title: "Send ERC721",
      component: <SendErc20 />
    },
    // Gov Menu 
    transferability: {
      title: "Toggle Transferability",
      component: <Crowdsale />,
    },
    votingPeriod: {
      title: "Update Voting Period",
      component: <Crowdsale />,
    },
    quorum: {
      title: "Update Quorum",
      component: <Crowdsale />,
    },
    // Admin Menu
    manager: {
      title: "Configure Extensions",
      component: <ConfigureExtensions />
    },
    docs: {
      title: "Configure Extensions",
      component: <ConfigureExtensions />
    },
    escape: {
      title: "Configure Extensions",
      component: <ConfigureExtensions />
    },
    call: {
      title: "Interact with External Contracts",
      component: <CallContract />
    },
    // Apply Menu
    crowdsale: {
      title: "Buy in Crowdsale",
      component: <Crowdsale />,
    },
    crowdsaleWithVesting: {
      title: "Crowdsale with Vesting",
      component: <Crowdsale />,
    },
    tribute: {
      title: "Tribute to Become Member",
      component: <Tribute />,
    },
    tributeWithVesting: {
      title: "Tribute with Vesting",
      component: <Crowdsale />,
    },
    signal: {
      title: "Signal",
      component: <Signal />,
    },
    // Back
    back: {
      title: "",
      component: <ProposalsMenu setProposal={setView} />,
    },
  }

  console.log(view)
  return (
    <>
    {view &&
    <Flex dir="col" gap="md" align="start"> 
      <DialogTitle>{proposals[view]["title"]}</DialogTitle>
      <Box
        css={{
          padding: '1 0 2 0'
        }} 
      >
        {proposals[view]["component"]}
      </Box>
      {view != "menu" && 
      <Button 
        variant="transparent" 
        effect="film"
        css={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.1em',
          maxWidth: '5em'
        }} 
        onClick={() => setView("menu")}>
          <DoubleArrowLeftIcon />
          Back
        </Button>}
    </Flex>}
    </>
  )
}
