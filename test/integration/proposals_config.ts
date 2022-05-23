import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import fip_104 from '@proposals/description/fip_104';
import balancer_gauge_fix from '@proposals/description/balancer_gauge_fix';
import withdraw_lbp_liquidity from '@proposals/description/withdraw_lbp_liquidity';

const proposals: ProposalsConfigMap = {
  fip_104: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: fip_104, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [
      'daiFixedPricePSMFeiSkimmer',
      'core',
      'compoundDaiPCVDeposit',
      'dpiToDaiLBPSwapper',
      'dpiToDaiLensDai',
      'dpiToDaiLensDpi',
      'collateralizationOracle',
      'tribalCouncilTimelock',
      'tribalCouncilSafe',
      'nopeDAO',
      'compoundEthPCVDeposit',
      'aaveEthPCVDeposit',
      'pcvGuardianNew',
      'uniswapPCVDeposit'
    ],
    deprecatedContractSignoff: [
      'rariPool31FeiPCVDepositWrapper',
      'rariPool25FeiPCVDepositWrapper',
      'rariPool9RaiPCVDepositWrapper',
      'aaveRaiPCVDepositWrapper',
      'rariPool19DpiPCVDepositWrapper',
      'liquityFusePoolLusdPCVDeposit',
      'rariPool72FeiPCVDepositWrapper',
      'raiDepositWrapper',
      'rariPool31FeiPCVDeposit',
      'rariPool25FeiPCVDeposit',
      'rariPool9RaiPCVDeposit',
      'aaveRaiPCVDeposit',
      'rariPool19DpiPCVDeposit',
      'rariPool72FeiPCVDeposit',
      'dpiDepositWrapper'
    ],
    category: ProposalCategory.DAO
  },
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
    category: ProposalCategory.TC
  }
};

export default proposals;
