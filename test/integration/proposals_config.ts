import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

// import fip_x from '@proposals/description/fip_x';
import fip_79 from '@proposals/description/fip_79';

const proposals: ProposalsConfigMap = {
  /*fip_x: {
    deploy: true,
    proposalId: null,
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_x
  }*/

  fip_79: {
    deploy: false,
    proposalId: null,
    affectedContractSignoff: ['core', 'feiDAOTimelock', 'tribe', 'ohmEscrow'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_79
  }
};

export default proposals;
