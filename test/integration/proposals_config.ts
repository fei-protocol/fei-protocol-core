import { ProposalsConfigMap } from '@custom-types/types';

// import fip_xx_proposal from '@proposals/description/fip_xx';

import backstop_proposal from '@proposals/description/backstop';
import fip_55_proposal from '@proposals/description/fip_55';
import fip_54_proposal from '@proposals/description/fip_54';
import merger_proposal from '@proposals/description/merger';

const proposals: ProposalsConfigMap = {
  /*
    fip_xx : {
        deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
        skipDAO: false, // whether or not to simulate proposal in DAO
        totalValue: 0, // amount of ETH to send to DAO execution
        proposal: fip_xx_proposal // full proposal file, imported from '@proposals/description/fip_xx.ts'
    }
    */
  // backstop: {
  //   deploy: true,
  //   skipDAO: false,
  //   totalValue: 0,
  //   proposal: backstop_proposal
  // },
  // fip_55: {
  //   deploy: false,
  //   skipDAO: false,
  //   totalValue: 0,
  //   proposal: fip_55_proposal
  // },
  // fip_54: {
  //   deploy: true,
  //   skipDAO: false,
  //   totalValue: 0,
  //   proposal: fip_54_proposal
  // },
  merger: {
    deploy: true,
    skipDAO: false,
    totalValue: 0,
    proposal: merger_proposal
  }
};

export default proposals;
