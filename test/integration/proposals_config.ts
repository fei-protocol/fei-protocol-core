import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import fip_87 from '@proposals/description/fip_87';

const proposals: ProposalsConfigMap = {
  fip_87: {
    deploy: false,
    proposalId: '114110038939654197374429334111955717306290796780942705117190274082864935809950',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_87
  }
};

export default proposals;
