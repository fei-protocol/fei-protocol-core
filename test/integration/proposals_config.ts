import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import aura_airdrop from '@proposals/description/aura_airdrop';
import repay_fuse_bad_debt from '@proposals/description/repay_fuse_bad_debt';
import end_tribe_incentives from '@proposals/description/end_tribe_incentives';

const proposals: ProposalsConfigMap = {
  aura_airdrop: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: aura_airdrop, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DEBUG
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
  }
};

export default proposals;
