import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import fip_87 from '@proposals/description/fip_87';

const proposals: ProposalsConfigMap = {
  fip_87: {
    deploy: true,
    proposalId: null,
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_87
  }
};

export default proposals;
