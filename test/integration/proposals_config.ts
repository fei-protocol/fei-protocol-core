import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import repay_fuse_bad_debt from '@proposals/description/repay_fuse_bad_debt';
import eth_lbp from '@proposals/description/eth_lbp';
import end_tribe_incentives from '@proposals/description/end_tribe_incentives';
import fip_104b from '@proposals/description/fip_104b';

const proposals: ProposalsConfigMap = {
  eth_lbp: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: eth_lbp, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.TC
  },
  repay_fuse_bad_debt: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: repay_fuse_bad_debt, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: ['core', 'fuseFixer', 'pcvGuardianNew'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.TC
  },
  end_tribe_incentives: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: end_tribe_incentives, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [
      'core',
      'tribalChief',
      'tribalCouncilTimelock',
      'collateralizationOracle',
      'opsOptimisticTimelock'
    ],
    deprecatedContractSignoff: [
      'creamDepositWrapper',
      'fei3CrvAutoRewardsDistributor',
      'd3AutoRewardsDistributor',
      'autoRewardsDistributor',
      'feiDaiAutoRewardsDistributor',
      'feiUsdcAutoRewardsDistributor',
      'stakingTokenWrapperRari',
      'stakingTokenWrapperFOXLaaS',
      'stakingTokenWrapperGROLaaS',
      'stakingTokenWrapperKYLINLaaS',
      'stakingTokenWrapperMStableLaaS',
      'stakingTokenWrapperNEARLaaS',
      'stakingTokenWrapperPoolTogetherLaaS',
      'stakingTokenWrapperUMALaaS',
      'stakingTokenWrapperSYNLaaS',
      'rewardsDistributorAdmin',
      'stwBulkHarvest',
      'stakingTokenWrapperBribeD3pool',
      'fei3CrvStakingtokenWrapper',
      'feiDaiStakingTokenWrapper',
      'feiUsdcStakingTokenWrapper',
      'stakingTokenWrapperBribe3Crvpool',
      'tribalChiefSyncV2',
      'tribalChiefSyncExtension',
      'd3StakingTokenWrapper',
      'votiumBriberD3pool'
    ],
    category: ProposalCategory.TC
  },
  fip_104b: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: fip_104b, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [
      'dpiToDaiLBPSwapper',
      'compoundDaiPCVDeposit',
      'tribalCouncilSafe',
      'ratioPCVControllerV2'
    ],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO
  }
};

export default proposals;
