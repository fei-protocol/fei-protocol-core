import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import swap_dpi_to_dai from '@proposals/description/swap_dpi_to_dai';

const proposals: ProposalsConfigMap = {
  swap_dpi_to_dai: {
    deploy: true,
    proposalId: null,
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: swap_dpi_to_dai
  }
};

export default proposals;
