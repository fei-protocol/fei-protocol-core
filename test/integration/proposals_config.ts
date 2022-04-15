import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import fip_90 from '@proposals/description/fip_90';

const proposals: ProposalsConfigMap = {
  fip_90: {
    deploy: true,
    proposalId: null,
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_90
  }
};

export default proposals;
