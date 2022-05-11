import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import withdraw_aave_comp_fei from '@proposals/description/withdraw_aave_comp_fei';

const proposals: ProposalsConfigMap = {
  withdraw_aave_comp_fei: {
    deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: withdraw_aave_comp_fei, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [''],
    deprecatedContractSignoff: [''],
    category: ProposalCategory.TC
  }
};

export default proposals;
