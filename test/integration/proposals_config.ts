import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import fip_78a from '@proposals/description/fip_78a';
import fip_78b from '@proposals/description/fip_78b';
import fip_78c from '@proposals/description/fip_78c';

const proposals: ProposalsConfigMap = {
  /*
    fip_xx : {
        deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
        skipDAO: false, // whether or not to simulate proposal in DAO
        totalValue: 0, // amount of ETH to send to DAO execution
        proposal: fip_xx_proposal // full proposal file, imported from '@proposals/description/fip_xx.ts'
    }
    */

  fip_78a: {
    deploy: false,
    proposalId: '',
    affectedContractSignoff: ['feiDAO', 'core', 'rariTimelock', 'feiDAOTimelock', 'timelock'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_78a
  },
  fip_78b: {
    deploy: false,
    proposalId: '',
    affectedContractSignoff: ['proxyAdmin', 'timelock', 'feiDAO', 'feiDAOTimelock'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_78b
  },
  fip_78c: {
    deploy: false,
    proposalId: '',
    affectedContractSignoff: ['timelock', 'rariTimelock'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_78c
  }
};

export default proposals;
