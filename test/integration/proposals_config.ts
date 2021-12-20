import { ProposalsConfigMap } from '@custom-types/types';

// import fip_xx_proposal from '@proposals/description/fip_xx';
import merger_proposal from '@proposals/description/merger';
import buyback_newpool from '@proposals/description/buyback_newpool';

const proposals: ProposalsConfigMap = {
  /*
    fip_xx : {
        deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
        skipDAO: false, // whether or not to simulate proposal in DAO
        totalValue: 0, // amount of ETH to send to DAO execution
        proposal: fip_xx_proposal // full proposal file, imported from '@proposals/description/fip_xx.ts'
    }
    */
  buyback_newpool: {
    deploy: false,
    skipDAO: false,
    totalValue: 0,
    proposal: buyback_newpool
  },
  merger: {
    deploy: false,
    skipDAO: false,
    totalValue: 0,
    proposal: merger_proposal
  }
};

export default proposals;
