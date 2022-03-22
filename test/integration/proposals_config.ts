import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

// import fip_x from '@proposals/description/fip_x';
import fip_85 from '@proposals/description/fip_85';

const proposals: ProposalsConfigMap = {
  /*fip_x: {
    deploy: true,
    proposalId: null,
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_x
  }*/

  fip_85: {
    deploy: false,
    proposalId: null,
    affectedContractSignoff: [
      'rariGovernanceProxyAdmin',
      'rariGovernanceTokenSushiSwapDistributor',
      'rariTimelock',
      '0x4650a83520be4f1e4cee726fdd169d37cea80525'
    ],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_85
  }
};

export default proposals;
