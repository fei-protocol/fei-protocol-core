import { ProposalCategory, TemplatedProposalsConfigMap } from '@custom-types/types';

import verify_rari_proposal from '@proposals/description/verify_rari_proposal';

export const ProposalsConfig: TemplatedProposalsConfigMap = {
  verify_rari_proposal: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: verify_rari_proposal, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO
  }
};

export default ProposalsConfig;
