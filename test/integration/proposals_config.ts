import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

// import fip_xx_proposal from '@proposals/description/fip_xx';

import fip_visor from '@proposals/description/fip_visor';
import fip_73 from '@proposals/description/fip_73';
import fip_70 from '@proposals/description/fip_70';

const proposals: ProposalsConfigMap = {
  /*
    fip_xx : {
        deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
        skipDAO: false, // whether or not to simulate proposal in DAO
        totalValue: 0, // amount of ETH to send to DAO execution
        proposal: fip_xx_proposal // full proposal file, imported from '@proposals/description/fip_xx.ts'
    }
    */
  fip_70: {
    deploy: false,
    proposalId: '69735027602527924842253936836766902646166984300134193529060263948046226490388',
    affectedContractSignoff: [
      'ratioPCVControllerV2',
      'delayedPCVMoverWethUniToBal',
      'weightedBalancerPoolManagerBase',
      'balancerDepositFeiWeth',
      'uniswapPCVDeposit',
      'collateralizationOracle',
      'core'
    ],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_70
  },
  fip_visor: {
    deploy: false,
    proposalId: undefined,
    affectedContractSignoff: ['optimisticTimelock'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.OA,
    totalValue: 0,
    proposal: fip_visor
  },
  fip_73: {
    deploy: false,
    proposalId: '38813827748657927688712449919303464603881921173152703694284146936644184242456',
    affectedContractSignoff: [
      'core',
      'optimisticTimelock',
      'pcvGuardian',
      'd3poolCurvePCVDeposit',
      'd3poolConvexPCVDeposit',
      'ethPSM',
      'collateralizationOracle',
      'wethDepositWrapper',
      'dpiDepositWrapper',
      'raiDepositWrapper',
      'agEurDepositWrapper',
      'opsOptimisticTimelock'
    ],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_73
  }
};

export default proposals;
