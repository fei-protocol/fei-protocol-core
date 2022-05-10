import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import withdrawD3Pool from '@proposals/description/withdraw_d3_pool';
import fip_105 from '@proposals/description/fip_105';

const proposals: ProposalsConfigMap = {
  fip_105: {
    deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: fip_105, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: ['daiPSMFeiSkimmer'],
    deprecatedContractSignoff: [''],
    category: ProposalCategory.DAO
  },
  withdraw_d3_pool: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: withdrawD3Pool, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: ['d3poolCurvePCVDeposit', 'd3poolConvexPCVDeposit'],
    deprecatedContractSignoff: [''],
    category: ProposalCategory.TC
  }
};

export default proposals;
