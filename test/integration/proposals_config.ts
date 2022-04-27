import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import fip_82 from '@proposals/description/fip_82';
import fip_98 from '@proposals/description/fip_98';

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
    proposalId: null,
    affectedContractSignoff: [
      'fei',
      'voltFeiSwapContract',
      'feiDAOTimelock',
      'collateralizationOracle',
      'voltDepositWrapper',
      'voltOracle',
      'volt',
      'turboFusePCVDeposit',
      'pcvGuardian'
    ],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_98
  }
};

export default proposals;
