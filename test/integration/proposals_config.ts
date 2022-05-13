import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import withdraw_d3_pool from '@proposals/description/withdraw_d3_pool';
import withdraw_aave_comp_fei from '@proposals/description/withdraw_aave_comp_fei';
import fip_105 from '@proposals/description/fip_105';
import oa_cr_fix from '@proposals/description/oa_cr_fix';
// import fip_xx_proposal from '@proposals/description/fip_xx';

const proposals: ProposalsConfigMap = {
  fip_105: {
    deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: fip_105, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: ['daiFixedPricePSMFeiSkimmer', 'core'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO
  },
  withdraw_d3_pool: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: withdraw_d3_pool, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: ['pcvGuardianNew', 'd3poolCurvePCVDeposit', 'd3poolConvexPCVDeposit', 'daiFixedPricePSM'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.TC
  },
  withdraw_aave_comp_fei: {
    deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: withdraw_aave_comp_fei, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: ['pcvGuardianNew', 'aaveFeiPCVDeposit', 'daiFixedPricePSM'],
    deprecatedContractSignoff: [''],
    category: ProposalCategory.TC
  },
  oa_cr_fix: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: oa_cr_fix, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: ['collateralizationOracle', 'balancerLensBpt30Fei70Weth'],
    deprecatedContractSignoff: [
      'balancerLensBpt30Fei70WethOld',
      'rariPool8FeiPCVDepositWrapper',
      'rariPool8DaiPCVDeposit',
      'rariPool8LusdPCVDeposit',
      'rariPool18FeiPCVDepositWrapper',
      'rariPool27FeiPCVDepositWrapper',
      'rariPool90FeiPCVDepositWrapper',
      'rariPool146EthPCVDeposit',
      'convexPoolPCVDepositWrapper'
    ],
    category: ProposalCategory.OA
  }
};

export default proposals;
