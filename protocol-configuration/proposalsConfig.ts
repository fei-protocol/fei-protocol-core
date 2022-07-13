import { ProposalCategory, TemplatedProposalsConfigMap } from '@custom-types/types';

import fip_x from '@proposals/description/fip_x';
import tip_119 from '@proposals/description/tip_119';
import pcv_guardian_v3 from '@proposals/description/pcv_guardian_v3';

export const ProposalsConfig: TemplatedProposalsConfigMap = {
  pcv_guardian_v3: {
    deploy: true,
    totalValue: 0,
    proposal: pcv_guardian_v3,
    proposalId: '',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO
  },
  tip_119: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: tip_119, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.TC
  }
};
