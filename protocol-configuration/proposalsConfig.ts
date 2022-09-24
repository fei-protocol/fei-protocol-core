import { ProposalCategory, TemplatedProposalsConfigMap } from '@custom-types/types';

import fip_x from '@proposals/description/fip_x';
import tip_121c from '@proposals/description/old/tip_121c';

export const ProposalsConfig: TemplatedProposalsConfigMap = {
  tip_121c: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: tip_121c, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '64863446409291443125870692229577565231046239594774676712611109555958259692263',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO
  }
};

export default ProposalsConfig;
