import { ProposalCategory, TemplatedProposalsConfigMap } from '@custom-types/types';

import deprecate_incentives from '@proposals/description/deprecate_incentives';

const proposals: TemplatedProposalsConfigMap = {
  deprecate_incentives: {
    deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: deprecate_incentives, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO
  }
};

export default proposals;
