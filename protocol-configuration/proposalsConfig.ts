import { ProposalCategory, TemplatedProposalsConfigMap } from '@custom-types/types';

import fip_x from '@proposals/description/fip_x';
import tip_121c_cont from '@proposals/description/tip_121c_cont';

export const ProposalsConfig: TemplatedProposalsConfigMap = {
  tip_121c_cont: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: tip_121c_cont, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO
  }
};

export default ProposalsConfig;
