import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

// import fip_xx_proposal from '@proposals/description/fip_xx';

import fip_76b from '@proposals/description/fip_76b';
import fip_77 from '@proposals/description/fip_77';

const proposals: ProposalsConfigMap = {
  /*
    fip_xx : {
        deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
        skipDAO: false, // whether or not to simulate proposal in DAO
        totalValue: 0, // amount of ETH to send to DAO execution
        proposal: fip_xx_proposal // full proposal file, imported from '@proposals/description/fip_xx.ts'
    }
    */
  fip_76b: {
    deploy: false,
    proposalId: undefined,
    affectedContractSignoff: [
      'delayedPCVMoverWethUniToBal',
      'balancerDepositFeiWeth',
      'aaveEthPCVDeposit',
      'uniswapPCVDeposit',
      'compoundDaiPCVDeposit',
      'bammDeposit',
      'ratioPCVControllerV2',
      'feiDAOTimelock',
      'collateralizationOracle',
      'rariPool8DaiPCVDeposit',
      'rariPool8LusdPCVDeposit',
      'votiumBriber3Crvpool'
    ],
    deprecatedContractSignoff: [
      'dpiUniswapPCVDeposit',
      'rariPool7FeiPCVDepositWrapper',
      'rariPool9FeiPCVDepositWrapper',
      'rariPool26FeiPCVDepositWrapper',
      'rariPool28FeiPCVDepositWrapper',
      'rariPool91FeiPCVDepositWrapper'
    ],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_76b
  },
  fip_77: {
    deploy: false,
    proposalId: undefined,
    affectedContractSignoff: ['tribalChief', 'fuseGuardian'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.OA,
    totalValue: 0,
    proposal: fip_77
  }
};

export default proposals;
