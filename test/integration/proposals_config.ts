import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

// import fip_xx_proposal from '@proposals/description/fip_xx';
import fip_62 from '@proposals/description/fip_62';

import fip_62_proposal from '@proposals/description/fip_62';

const proposals: ProposalsConfigMap = {
  /*
    fip_xx : {
        deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
        skipDAO: false, // whether or not to simulate proposal in DAO
        totalValue: 0, // amount of ETH to send to DAO execution
        proposal: fip_xx_proposal // full proposal file, imported from '@proposals/description/fip_xx.ts'
    }
    */
  fip_60: {
    deploy: false,
    proposalId: '22694F289BABFB99A255EB1BC40608360D8BC81FAD6176DEA39CA27F760F0DA4',
    affectedContractSignoff: [
      'rariPool8Comptroller',
      'rariPool8MasterOracle',
      'd3StakingTokenWrapper',
      'tribalChief',
      'fei3CrvStakingtokenWrapper',
      'd3AutoRewardsDistributor',
      'fei3CrvAutoRewardsDistributor',
      'rewardsDistributorAdmin',
      'fuseGuardian'
    ],
    deprecatedContractSignoff: [],
    category: ProposalCategory.OA,
    totalValue: 0,
    proposal: undefined
  },
  fip_62: {
    deploy: true,
    proposalId: undefined,
    affectedContractSignoff: [
      'ethPSM',
      'PSMRouter',
      'aaveEthPCVDripController',
      'collateralizationOracle',
      'bondingCurve',
      'ethReserveStabilizer',
      'ethReserveStabilizerWrapper'
    ],
    deprecatedContractSignoff: [
      'compoundEthPCVDripController',
      'bondingCurve',
      'ethReserveStabilizer',
      'ethReserveStabilizerWrapper'
    ],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_62_proposal
  }
};

export default proposals;
