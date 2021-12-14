import { ProposalsConfigMap } from '@custom-types/types';

// import fip_xx_proposal from '@proposals/description/fip_xx';

import fip_50_proposal from '@proposals/description/fip_50';
import fip_56_proposal from '@proposals/description/fip_56';
import fip_54_proposal from '@proposals/description/fip_54';
import merger_proposal from '@proposals/description/merger';
import fip_53_proposal from '@proposals/description/fip_53';

const proposals: ProposalsConfigMap = {
  /*
    fip_xx : {
        deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
        skipDAO: false, // whether or not to simulate proposal in DAO
        totalValue: 0, // amount of ETH to send to DAO execution
        proposal: fip_xx_proposal // full proposal file, imported from '@proposals/description/fip_xx.ts'
    }
    */
  fip_50: {
    deploy: true,
    skipDAO: false,
    totalValue: 0,
    proposal: fip_50_proposal
  },
  fip_53: {
    deploy: false,
    skipDAO: false,
    totalValue: 0,
    proposal: fip_53_proposal
  },
  merger: {
    deploy: false,
    skipDAO: false,
    totalValue: 0,
    proposal: merger_proposal
  },
  fip_56: {
    deploy: false,
    skipDAO: false,
    totalValue: 0,
    proposal: fip_56_proposal
  }
};

export default proposals;
