import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import fip_99 from '@proposals/description/fip_99';

const proposals: ProposalsConfigMap = {
  fip_99: {
    deploy: true,
    proposalId: null,
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_99
  }
};

export default proposals;
