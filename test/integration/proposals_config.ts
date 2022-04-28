import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import fip_82 from '@proposals/description/fip_82';
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
    deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: fip_82, // full proposal file, imported from '@proposals/description/fip_xx.ts'
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
    deploy: true,
    proposalId: null,
    affectedContractSignoff: [
      'ratioPCVControllerV2',
      'rariPool9RaiPCVDeposit',
      'aaveRaiPCVDeposit',
      'raiPCVDripController',
      'raiPriceBoundPSM',
      'pcvGuardian'
    ],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_99
  }
};

export default proposals;
