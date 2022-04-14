import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import fip_82 from '@proposals/description/fip_82';
import fip_82b from '@proposals/description/fip_82b';

const proposals: ProposalsConfigMap = {
  fip_82: {
    deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: fip_82,
    proposalId: '',
    affectedContractSignoff: [
      'podAdminFactory',
      'roleBastion',
      'podFactory',
      'podExecutor',
      'nopeDAO',
      'governanceMetadataRegistry',
      'core',
      'tribe'
    ],
    deprecatedContractSignoff: [''],
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
  }
};

export default proposals;
