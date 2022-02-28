import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import fip_83 from '@proposals/description/fip_83';

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
    deploy: false,
    proposalId: '42252633381525796377407696085248355994722597040719506134401876309524117642013',
    affectedContractSignoff: ['core', 'fei', 'laTribuTribeTimelock', 'laTribuFeiTimelock'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_83
  }
};

export default proposals;
