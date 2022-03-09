import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import fip_82a from '@proposals/description/fip_82a';

const proposals: ProposalsConfigMap = {
  fip_82a: {
    deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: fip_82a, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [''],
    deprecatedContractSignoff: [''],
    category: ProposalCategory.DAO
  }
};

export default proposals;
