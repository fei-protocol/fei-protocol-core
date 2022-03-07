import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import fip_82 from '@proposals/description/fip_82';

const proposals: ProposalsConfigMap = {
  fip_82: {
    deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    skipDAO: false, // whether or not to simulate proposal in DAO
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: fip_82 // full proposal file, imported from '@proposals/description/fip_xx.ts'
  }
};

export default proposals;
