import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import fip_97 from '@proposals/description/fip_97';

const proposals: ProposalsConfigMap = {
  fip_97: {
    deploy: true,
    proposalId: null,
    affectedContractSignoff: ['turboFusePCVDeposit'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.OA,
    totalValue: 0,
    proposal: fip_97
  },
  fip_85: {
    deploy: false,
    proposalId: null,
    affectedContractSignoff: [
      'rariGovernanceProxyAdmin',
      'rariGovernanceTokenSushiSwapDistributor',
      'rariTimelock'
    ],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_85
  }
};

export default proposals;
