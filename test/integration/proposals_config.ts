import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

// import fip_xx_proposal from '@proposals/description/fip_xx';
import fip_78a from '@proposals/description/fip_78a';
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
  fip_84b: {
    deploy: false,
    proposalId: '111980608549296280462721500887998027192667619429469223121519018371053122326953',
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
  },
  fip_78a: {
    deploy: false,
    proposalId: undefined,
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_78a
  }
};

export default proposals;
