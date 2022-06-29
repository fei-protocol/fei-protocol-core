import { ProposalCategory, TemplatedProposalsConfigMap } from '@custom-types/types';

import tip_118 from '@proposals/description/tip_118';

const proposals: TemplatedProposalsConfigMap = {
  tip_118: {
    deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: tip_118, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO
  }
};

export default proposals;
