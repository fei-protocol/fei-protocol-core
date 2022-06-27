import { ProposalCategory, TemplatedProposalDescription, TemplatedProposalsConfigMap } from '@custom-types/types';

import tip_117 from '@proposals/description/tip_117';

const proposals: TemplatedProposalsConfigMap = {
  fuse_withdrawal_guard: {
    deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: tip_117, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.None
  }
  // tip_117: {
  //   deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
  //   totalValue: 0, // amount of ETH to send to DAO execution
  //   proposal: tip_117, // full proposal file, imported from '@proposals/description/fip_xx.ts'
  //   proposalId: '',
  //   affectedContractSignoff: [],
  //   deprecatedContractSignoff: [],
  //   category: ProposalCategory.DAO
  // },
};

export default proposals;
