import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import balancer_gauge_fix from '@proposals/description/balancer_gauge_fix';
import withdraw_lbp_liquidity from '@proposals/description/withdraw_lbp_liquidity';

const proposals: ProposalsConfigMap = {
  balancer_gauge_fix: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: balancer_gauge_fix, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: null,
    affectedContractSignoff: [
      'tribalCouncilTimelock',
      'balancerDepositFeiWeth',
      'balancerLensBpt30Fei70Weth',
      'pcvGuardianNew',
      'core',
      'balancerGaugeStaker',
      'collateralizationOracle',
      'pcvGuardianNew'
    ],
    deprecatedContractSignoff: ['balancerLensBpt30Fei70WethOld'],
    category: ProposalCategory.TC
  },
  withdraw_lbp_liquidity: {
    deploy: false,
    totalValue: 0,
    proposal: withdraw_lbp_liquidity,
    proposalId: '',
    affectedContractSignoff: [
      'dpiToDaiLBPSwapper',
      'compoundDaiPCVDeposit',
      'pcvGuardianNew',
      'tribalCouncilSafe',
      'tribalCouncilTimelock'
    ],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO
  }
};

export default proposals;
