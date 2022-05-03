import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import fip_82 from '@proposals/description/fip_82';
import fip_82b from '@proposals/description/fip_82b';
import fip_98 from '@proposals/description/fip_98';
import fip_99 from '@proposals/description/fip_99';

// import fip_xx_proposal from '@proposals/description/fip_xx';

const proposals: ProposalsConfigMap = {
  /*
    fip_xx: {
      deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
      totalValue: 0, // amount of ETH to send to DAO execution
      proposal: fip_xx, // full proposal file, imported from '@proposals/description/fip_xx.ts'
      proposalId: '',
      affectedContractSignoff: [''],
      deprecatedContractSignoff: [''],
      category: ProposalCategory.DAO
    }
    */
  fip_82: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: fip_82,
    proposalId: '',
    affectedContractSignoff: [
      'roleBastion',
      'podFactory',
      'podExecutor',
      'nopeDAO',
      'governanceMetadataRegistry',
      'core',
      'tribe',
      'feiDAOTimelock',
      'tribalCouncilTimelock',
      'tribalCouncilSafe',
      'podAdminGateway'
    ],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO
  },
  fip_82b: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: fip_82b,
    proposalId: '',
    affectedContractSignoff: [
      'core',
      'fuseGuardian',
      'optimisticMinter',
      'pcvEquityMinter',
      'indexDelegator',
      'ethTokemakPCVDeposit',
      'uniswapPCVDeposit',
      'daiPSMFeiSkimmer',
      'lusdPSMFeiSkimmer',
      'ethPSMFeiSkimmer',
      'aaveEthPCVDripController',
      'daiPCVDripController',
      'lusdPCVDripController',
      'compoundEthPCVDripController',
      'tribalCouncilTimelock',
      'feiDAOTimelock',
      'roleBastion',
      'opsOptimisticTimelock',
      'optimisticTimelock',
      'tribalChiefSyncV2'
    ],
    deprecatedContractSignoff: ['daiPSMFeiSkimmer', 'compoundEthPCVDripController'],
    category: ProposalCategory.DAO
  },
  fip_98: {
    deploy: false,
    proposalId: '47738997083165992958921925097327638388915944734650384828020246684763693471048',
    affectedContractSignoff: [
      'fei',
      'feiDAOTimelock',
      'voltFeiSwapContract',
      'collateralizationOracle',
      'volt',
      'voltOracle',
      'voltDepositWrapper',
      'pcvGuardian',
      'turboFusePCVDeposit'
    ],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_98
  },
  fip_99: {
    deploy: false,
    proposalId: null,
    affectedContractSignoff: [
      'collateralizationOracle',
      'ratioPCVControllerV2',
      'rariPool9RaiPCVDeposit',
      'aaveRaiPCVDeposit',
      'raiPCVDripController',
      'raiPriceBoundPSM',
      'pcvGuardian',
      'core'
    ],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_99
  }
};

export default proposals;
