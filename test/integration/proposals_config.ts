import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

// import fip_xx_proposal from '@proposals/description/fip_xx';

import fip_76b from '@proposals/description/fip_76b';

const proposals: ProposalsConfigMap = {
  /*
    fip_xx : {
        deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
        skipDAO: false, // whether or not to simulate proposal in DAO
        totalValue: 0, // amount of ETH to send to DAO execution
        proposal: fip_xx_proposal // full proposal file, imported from '@proposals/description/fip_xx.ts'
    }
    */
  fip_cvx: {
    deploy: false, // deployed from other repos
    proposalId: undefined,
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.None,
    totalValue: 0,
    proposal: undefined
  },
  fip_76b: {
    deploy: false,
    proposalId: '73485618643971795717112481006319668453253357499719729532595075539568233811807',
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
  }
};

export default proposals;
