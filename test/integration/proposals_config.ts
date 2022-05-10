import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import withdrawD3Pool from '@proposals/description/withdrawD3Pool';

const proposals: ProposalsConfigMap = {
  withdraw_d3_pool: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: withdrawD3Pool, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [''],
    deprecatedContractSignoff: [''],
    category: ProposalCategory.TC
  }
};

export default proposals;
