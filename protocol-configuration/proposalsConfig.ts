import { ProposalCategory, TemplatedProposalsConfigMap } from '@custom-types/types';

import fip_x from '@proposals/description/fip_x';

import tip_118 from '@proposals/description/tip_118';

// This config contains each of the active governance proposals in the protocol - DAO, TC, or otherwise.
// The key for each should be the proposal name or number, and the value should be the TemplatedProposalConfig.

export const ProposalsConfig: TemplatedProposalsConfigMap = {
  tip_118: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: tip_118, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO
  }
};
