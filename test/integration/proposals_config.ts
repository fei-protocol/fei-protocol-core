import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import fip_84a from '@proposals/description/fip_84a';
import fip_84b from '@proposals/description/fip_84b';
import fip_84c from '@proposals/description/fip_84c';

import fip_78 from '@proposals/description/fip_78';

const proposals: ProposalsConfigMap = {
  /*
    fip_xx : {
        deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
        skipDAO: false, // whether or not to simulate proposal in DAO
        totalValue: 0, // amount of ETH to send to DAO execution
        proposal: fip_xx_proposal // full proposal file, imported from '@proposals/description/fip_xx.ts'
    }
    */
  fip_78: {
    deploy: true,
    proposalId: '',
    affectedContractSignoff: ['uniswapV3OracleWrapper', 'uniswapWrapper'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_78
  }
};

export default proposals;
