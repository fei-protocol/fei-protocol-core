import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import fip_79 from '@proposals/description/fip_79';

const proposals: ProposalsConfigMap = {
  fip_79: {
    deploy: true,
    proposalId: '',
    affectedContractSignoff: ['uniswapV3OracleWrapper', 'uniswapWrapper'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_79
  }
};

export default proposals;
