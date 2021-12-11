import { ProposalsConfigMap } from '@custom-types/types';

// import fip_xx_proposal from '@proposals/description/fip_xx';

import lusd_swap_grant_swapper_role from '@proposals/description/lusd_swap_grant_swapper_role';
import backstop_proposal from '@proposals/description/backstop';
import fip_52_proposal from '@proposals/description/fip_52';
import fip_54_proposal from '@proposals/description/fip_54';

const proposals: ProposalsConfigMap = {
  /*
    fip_xx : {
        deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
        skipDAO: false, // whether or not to simulate proposal in DAO
        totalValue: 0, // amount of ETH to send to DAO execution
        proposal: fip_xx_proposal // full proposal file, imported from '@proposals/description/fip_xx.ts'
    }
    */
  backstop: {
    deploy: true,
    skipDAO: false,
    totalValue: 0,
    proposal: backstop_proposal
  },
  fip_52: {
    deploy: false,
    skipDAO: false,
    totalValue: 0,
    proposal: fip_52_proposal
  },
  lusd_swap_grant_swapper_role: {
    deploy: false,
    skipDAO: false,
    totalValue: 0,
    proposal: lusd_swap_grant_swapper_role
  }
};

export default proposals;
