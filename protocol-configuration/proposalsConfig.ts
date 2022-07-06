import { ProposalCategory, TemplatedProposalDescription, TemplatedProposalsConfigMap } from '@custom-types/types';

import fip_x from '@proposals/description/fip_x';
import rocketpool from '@proposals/description/rocketpool';

const proposals: TemplatedProposalsConfigMap = {
  rocketpool: {
    deploy: true,
    totalValue: 0,
    proposal: rocketpool,
    proposalId: '',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DEBUG_TC
  }
};

export default proposals;
