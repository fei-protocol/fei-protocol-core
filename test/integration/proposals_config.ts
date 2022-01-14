import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

// import fip_xx_proposal from '@proposals/description/fip_xx';

import fip_54 from '@proposals/description/fip_54';
import fip_60b from '@proposals/description/fip_60b';
import fip_63 from '@proposals/description/fip_63';
import fip_64 from '@proposals/description/fip_64';

const proposals: ProposalsConfigMap = {
  /*
    fip_xx : {
        deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
        skipDAO: false, // whether or not to simulate proposal in DAO
        totalValue: 0, // amount of ETH to send to DAO execution
        proposal: fip_xx_proposal // full proposal file, imported from '@proposals/description/fip_xx.ts'
    }
    */
  fip_54: {
    deploy: false,
    proposalId: undefined,
    affectedContractSignoff: [
      'restrictedPermissions',
      'fei',
      'core',
      'ethPSMFeiSkimmer',
      'daiPSMFeiSkimmer',
      'rariInfraTribeTimelock',
      'rariInfraFeiTimelock',
      'votiumBriberD3pool',
      'opsOptimisticTimelock'
    ],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_54
  },
  fip_60b: {
    deploy: false,
    proposalId: undefined,
    affectedContractSignoff: [
      'rewardsDistributorAdmin',
      'fuseAdmin',
      'rariPool8Comptroller',
      'rariPool8MasterOracle',
      'gUniFuseOracle',
      'rariPool8EthIrm',
      'rariPool8CTokenImpl',
      'fuseGuardian',
      'tribalChief',
      'feiDaiStakingTokenWrapper',
      'feiUsdcStakingTokenWrapper',
      'feiDaiAutoRewardsDistributor',
      'feiUsdcAutoRewardsDistributor'
    ],
    deprecatedContractSignoff: [],
    category: ProposalCategory.OA,
    totalValue: 0,
    proposal: fip_60b
  },
  fip_63: {
    deploy: false,
    proposalId: undefined,
    affectedContractSignoff: [
      'lusdPSM',
      'lusdPCVDripController',
      'lusdPSMFeiSkimmer',
      'collateralizationOracle',
      'core',
      'pcvGuardian'
    ],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_63
  },
  fip_64: {
    deploy: false,
    proposalId: undefined,
    affectedContractSignoff: ['fuseAdmin', 'rariPool8EthIrm', 'rariPool8CTokenImpl', 'fuseGuardian'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.OA,
    totalValue: 0,
    proposal: fip_64
  }
};

export default proposals;
