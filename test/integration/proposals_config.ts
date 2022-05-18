import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import fip_105 from '@proposals/description/fip_105';
import withdraw_lbp_liquidity from '@proposals/description/lbp_withdraw';
// import fip_xx_proposal from '@proposals/description/fip_xx';

const proposals: ProposalsConfigMap = {
  fip_105: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: fip_105, // full proposal file, imported from '@proposals/description/fip_xx.ts'
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
      'aaveEthPCVDeposit'
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
