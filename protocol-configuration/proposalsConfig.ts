import { ProposalCategory, TemplatedProposalsConfigMap } from '@custom-types/types';

import fip_x from '@proposals/description/fip_x';

export const ProposalsConfig: TemplatedProposalsConfigMap = {
  // fip_x: {
  //   deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
  //   totalValue: 0, // amount of ETH to send to DAO execution
  //   proposal: fip_x, // full proposal file, imported from '@proposals/description/fip_xx.ts'
  //   proposalId: '',
  //   affectedContractSignoff: [],
  //   deprecatedContractSignoff: [],
  //   category: ProposalCategory.DAO
  // }
};

export default ProposalsConfig;
