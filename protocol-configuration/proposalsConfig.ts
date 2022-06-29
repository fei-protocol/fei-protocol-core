import { ProposalCategory, TemplatedProposalDescription, TemplatedProposalsConfigMap } from '@custom-types/types';

import fip_x from '@proposals/description/fip_x';

const proposals: TemplatedProposalsConfigMap = {
  fuse_withdrawal_guard: {
    deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: fip_x as unknown as TemplatedProposalDescription, // temporary hacky workaround, this field isn't needed but can't be undefined
    proposalId: '',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.None
  }
};

export default proposals;
