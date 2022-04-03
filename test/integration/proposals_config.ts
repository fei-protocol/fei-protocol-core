import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import fip_94 from '@proposals/description/fip_94';

const proposals: ProposalsConfigMap = {
  fip_94: {
    deploy: false,
    proposalId: null,
    affectedContractSignoff: ['rariTimelock'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_94
  }
};

export default proposals;
