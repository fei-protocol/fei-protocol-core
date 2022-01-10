import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

// import fip_xx_proposal from '@proposals/description/fip_xx';

import fip_60 from '@proposals/description/fip_60';
import fip_62 from '@proposals/description/fip_62';

const proposals: ProposalsConfigMap = {
  /*
    fip_xx : {
        deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
        skipDAO: false, // whether or not to simulate proposal in DAO
        totalValue: 0, // amount of ETH to send to DAO execution
        proposal: fip_xx_proposal // full proposal file, imported from '@proposals/description/fip_xx.ts'
    }
    */
  // fip_60: {
  //   deploy: false,
  //   proposalId: undefined,
  //   affectedContractSignoff: [
  //     'rariPool8Comptroller',
  //     'rariPool8MasterOracle',
  //     'd3StakingTokenWrapper',
  //     'tribalChief',
  //     'fei3CrvStakingtokenWrapper',
  //     'd3AutoRewardsDistributor',
  //     'fei3CrvAutoRewardsDistributor',
  //     'rewardsDistributorAdmin',
  //     'fuseGuardian'
  //   ],
  //   deprecatedContractSignoff: [],
  //   category: ProposalCategory.OA,
  //   totalValue: 0,
  //   proposal: fip_60
  // },
  fip_62: {
    deploy: false,
    proposalId: '85955812255891965249900586182423874595375644650518174119671869653470301469586',
    affectedContractSignoff: [
      'ethPSM',
      'ethPSMRouter',
      'aaveEthPCVDripController',
      'collateralizationOracle',
      'bondingCurve',
      'ethReserveStabilizer',
      'ethReserveStabilizerWrapper',
      'ratioPCVControllerV2',
      'aaveEthPCVDeposit',
      'core',
      'pcvGuardian'
    ],
    deprecatedContractSignoff: [
      'compoundEthPCVDripController',
      'bondingCurve',
      'ethReserveStabilizer',
      'ethReserveStabilizerWrapper'
    ],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_62
  }
};

export default proposals;
