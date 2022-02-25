import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import fip_83 from '@proposals/description/fip_83';
import fip_84a from '@proposals/description/fip_84a';
import fip_84b from '@proposals/description/fip_84b';
import fip_84c from '@proposals/description/fip_84c';

const proposals: ProposalsConfigMap = {
  /*
    fip_xx : {
        deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
        skipDAO: false, // whether or not to simulate proposal in DAO
        totalValue: 0, // amount of ETH to send to DAO execution
        proposal: fip_xx_proposal // full proposal file, imported from '@proposals/description/fip_xx.ts'
    }
    */
  fip_83: {
    deploy: true,
    proposalId: null,
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_83
  },
  fip_84a: {
    deploy: false,
    proposalId: '90781494616199164598522639897196626909064874385916078084737651147175659861373',
    affectedContractSignoff: ['feiDAO', 'core', 'rariTimelock', 'feiDAOTimelock', 'timelock'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_84a
  },
  fip_84b: {
    deploy: false,
    proposalId: '',
    affectedContractSignoff: ['proxyAdmin', 'timelock', 'feiDAO', 'feiDAOTimelock'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_84b
  },
  fip_84c: {
    deploy: false,
    proposalId: '34000709159909885586797325379867128929719243307711747917169184886926028102786',
    affectedContractSignoff: ['timelock', 'rariTimelock'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_84c
  }
};

export default proposals;
