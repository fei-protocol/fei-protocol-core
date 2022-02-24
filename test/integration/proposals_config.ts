import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import fip_85 from '@proposals/description/fip_85';

const proposals: ProposalsConfigMap = {
  fip_85: {
    deploy: true,
    proposalId: '',
    affectedContractSignoff: ['uniswapV3OracleWrapper', 'uniswapWrapper', 'daiFixedPricePSM', 'ethPSM'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_85
  }
};

export default proposals;
