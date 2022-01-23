import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

// import fip_xx_proposal from '@proposals/description/fip_xx';

import fip_60c from '@proposals/description/fip_60c';
import fip_73 from '@proposals/description/fip_73';

const proposals: ProposalsConfigMap = {
  /*
    fip_xx : {
        deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
        skipDAO: false, // whether or not to simulate proposal in DAO
        totalValue: 0, // amount of ETH to send to DAO execution
        proposal: fip_xx_proposal // full proposal file, imported from '@proposals/description/fip_xx.ts'
    }
    */
  fip_73: {
    deploy: false,
    proposalId: null,
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
  },
  fip_60c: {
    deploy: false,
    proposalId: undefined,
    affectedContractSignoff: [
      'rariPool90FeiPCVDepositWrapper',
      'rariPool91FeiPCVDepositWrapper',
      'rariPool79FeiPCVDepositWrapper',
      'rariPool72FeiPCVDepositWrapper',
      'rariPool128FeiPCVDepositWrapper',
      'rariPool22FeiPCVDepositWrapper',
      'rariPool28FeiPCVDepositWrapper',
      'rariPool31FeiPCVDepositWrapper',
      'collateralizationOracle',
      'rariPool90FeiPCVDeposit',
      'rariPool91FeiPCVDeposit',
      'rariPool79FeiPCVDeposit',
      'rariPool72FeiPCVDeposit',
      'rariPool28FeiPCVDeposit',
      'rariPool31FeiPCVDeposit',
      'rariPool128FeiPCVDeposit',
      'fei',
      'tribalChief'
    ],
    deprecatedContractSignoff: [],
    category: ProposalCategory.OA,
    totalValue: 0,
    proposal: fip_60c
  }
};

export default proposals;
