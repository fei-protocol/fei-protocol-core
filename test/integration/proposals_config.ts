import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import fip_79a from '@proposals/description/fip_79a';
import fip_79b from '@proposals/description/fip_79b';
import fip_79c from '@proposals/description/fip_79c';

const proposals: ProposalsConfigMap = {
  /*
    fip_xx : {
        deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
        skipDAO: false, // whether or not to simulate proposal in DAO
        totalValue: 0, // amount of ETH to send to DAO execution
        proposal: fip_xx_proposal // full proposal file, imported from '@proposals/description/fip_xx.ts'
    }
    */

  fip_79a: {
    deploy: false,
    proposalId: '',
    affectedContractSignoff: ['feiDAO'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_79a
  }
  // fip_79b: {
  //   deploy: false,
  //   proposalId: '',
  //   affectedContractSignoff: ['proxyAdmin', 'timelock', 'feiDAO'],
  //   deprecatedContractSignoff: [],
  //   category: ProposalCategory.DAO,
  //   totalValue: 0,
  //   proposal: fip_79b
  // },
  // fip_79c: {
  //   deploy: false,
  //   proposalId: '',
  //   affectedContractSignoff: ['timelock'],
  //   deprecatedContractSignoff: [],
  //   category: ProposalCategory.DAO,
  //   totalValue: 0,
  //   proposal: fip_79c
  // }
};

export default proposals;
