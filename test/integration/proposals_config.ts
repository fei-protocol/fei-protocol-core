import { ProposalsConfigMap } from '@custom-types/types';

// import fip_xx_proposal from '@proposals/description/fip_xx';

import permanently_revoke_burner_proposal from '@proposals/description/permanently_revoke_burner';
import lusd_swap_grant_swapper_role from '@proposals/description/lusd_swap_grant_swapper_role';

const proposals: ProposalsConfigMap = {
  /*
    fip_xx : {
        deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
        skipDAO: false, // whether or not to simulate proposal in DAO
        totalValue: 0, // amount of ETH to send to DAO execution
        proposal: fip_xx_proposal // full proposal file, imported from '@proposals/description/fip_xx.ts'
    } 
    */
  permanently_revoke_burner: {
    deploy: true,
    skipDAO: false,
    totalValue: 0,
    proposal: permanently_revoke_burner_proposal
  },
  lusd_swap_grant_swapper_role: {
    deploy: false,
    skipDAO: false,
    totalValue: 0,
    proposal: lusd_swap_grant_swapper_role
  }
};

export default proposals;
