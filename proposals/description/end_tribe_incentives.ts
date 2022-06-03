import { ProposalDescription } from '@custom-types/types';

const end_tribe_incentives: ProposalDescription = {
  // Pool ID is where the pool is in the array
  title: 'TIP-109: Discontinue Tribe Incentives',
  commands: [
    /////// TC grants itself TRIBAL_CHIEF_ADMIN_ROLE
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x23970cab3799b6876df4319661e6c03cc45bd59628799d92e988dd8cbdc90e31', '{tribalCouncilTimelock}'],
      description: 'Grant TRIBAL_CHIEF_ADMIN_ROLE to Tribal Council timelock'
    },

    /////////////  Replicate onlyGovernor behaviour or resetRewards()
    //////// Set Pool allocation points to 0. This also updates reward variables
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['0', '1', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 0 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['1', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 1 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['2', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 2 rewards to 0 and do not overwrite or change the rewarder'
    },

    // Note: Setting a single pool here to have an AP point != 0
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['3', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 3 rewards to 1 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['4', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 4 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['5', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 5 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['6', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 6 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['7', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 7 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['8', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 8 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['9', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 9 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['10', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 10 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['11', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 11 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['12', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 12 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['13', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 13 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['14', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 14 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['15', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 15 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['16', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 16 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['17', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 17 rewards to 0 and do not overwrite or change the rewarder'
    },

    ////  Set block rewards to effectively 0
    {
      target: 'tribalChief',
      values: '0',
      method: 'updateBlockReward(uint256)',
      arguments: ['100000'],
      description: 'Set Tribal Chief block reward effectively to zero. Setting to 100000'
    },

    //// Sync new reward speeds on all AutoRewardDistributors
    {
      target: 'autoRewardsDistributor',
      values: '0',
      method: 'setAutoRewardsDistribution()',
      arguments: [],
      description: 'Sync the reward speed of the AutoRewardsDistributor'
    },
    {
      target: 'd3AutoRewardsDistributor',
      values: '0',
      method: 'setAutoRewardsDistribution()',
      arguments: [],
      description: 'Sync the reward speed of the d3AutoRewardsDistributor'
    },
    {
      target: 'fei3CrvAutoRewardsDistributor',
      values: '0',
      method: 'setAutoRewardsDistribution()',
      arguments: [],
      description: 'Sync the reward speed of the fei3CrvAutoRewardsDistributor'
    },
    {
      target: 'feiDaiAutoRewardsDistributor',
      values: '0',
      method: 'setAutoRewardsDistribution()',
      arguments: [],
      description: 'Sync the reward speed of the feiDaiAutoRewardsDistributor'
    },
    {
      target: 'feiUsdcAutoRewardsDistributor',
      values: '0',
      method: 'setAutoRewardsDistribution()',
      arguments: [],
      description: 'Sync the reward speed of the feiUsdcAutoRewardsDistributor'
    },
    ///// Deprecate roles of Incentives system
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: [
        '0x7f85477db6c0857f19179a2b3846a7ddbc64caeeb3a02ef34771b82f5ab926e4', // FUSE_ADMIN
        '{tribalChiefSyncV2}'
      ],
      description: 'Revoke FUSE_ADMIN from tribalChiefSyncV2'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: [
        '0x23970cab3799b6876df4319661e6c03cc45bd59628799d92e988dd8cbdc90e31', // TRIBAL_CHIEF_ADMIN_ROLE
        '{tribalChiefSyncV2}'
      ],
      description: 'Revoke TRIBAL_CHIEF_ADMIN_ROLE from tribalChiefSyncV2'
    },

    // Deprecate RewardDistributorAdmin internal roles
    {
      target: 'rewardsDistributorAdmin',
      values: '0',
      method: 'becomeAdmin()',
      arguments: [],
      description:
        'Grant the TC timelock the DEFAULT_ADMIN_ROLE, to it can dismantle the RewardDistributorAdmin permissions'
    },
    {
      target: 'rewardsDistributorAdmin',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: [
        '0x19cca239eaee0f28c6ba4c8c860332b8a23b35008b89b0507b96138ca5691cbb', // AUTO_REWARDS_DISTRIBUTOR_ROLE
        '{feiDaiAutoRewardsDistributor}'
      ],
      description: 'Revoke AUTO_REWARDS_DISTRIBUTOR_ROLE from feiDaiAutoRewardsDistributor'
    },
    {
      target: 'rewardsDistributorAdmin',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: [
        '0x19cca239eaee0f28c6ba4c8c860332b8a23b35008b89b0507b96138ca5691cbb', // AUTO_REWARDS_DISTRIBUTOR_ROLE
        '{feiUsdcAutoRewardsDistributor}'
      ],
      description: 'Revoke AUTO_REWARDS_DISTRIBUTOR_ROLE from feiUsdcAutoRewardsDistributor'
    },
    {
      target: 'rewardsDistributorAdmin',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: [
        '0x19cca239eaee0f28c6ba4c8c860332b8a23b35008b89b0507b96138ca5691cbb', // AUTO_REWARDS_DISTRIBUTOR_ROLE
        '{autoRewardsDistributor}'
      ],
      description: 'Revoke AUTO_REWARDS_DISTRIBUTOR_ROLE from autoRewardsDistributor'
    },
    {
      target: 'rewardsDistributorAdmin',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: [
        '0x19cca239eaee0f28c6ba4c8c860332b8a23b35008b89b0507b96138ca5691cbb', // AUTO_REWARDS_DISTRIBUTOR_ROLE
        '{d3AutoRewardsDistributor}'
      ],
      description: 'Revoke AUTO_REWARDS_DISTRIBUTOR_ROLE from d3AutoRewardsDistributor'
    },
    {
      target: 'rewardsDistributorAdmin',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: [
        '0x19cca239eaee0f28c6ba4c8c860332b8a23b35008b89b0507b96138ca5691cbb', // AUTO_REWARDS_DISTRIBUTOR_ROLE
        '{fei3CrvAutoRewardsDistributor}'
      ],
      description: 'Revoke AUTO_REWARDS_DISTRIBUTOR_ROLE from fei3CrvAutoRewardsDistributor'
    },

    ////// Remove CREAM from CR
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposit(address)',
      arguments: ['{creamDepositWrapper}'],
      description: 'Remove empty CREAM deposit from the CR oracle'
    }
  ],
  description: `
  TIP-109: Discontinue Tribe Incentives

  This proposal will disable all Tribe incentives. Specifically it:
  - Sets the allocation points of all pools effectively to 0
  - Updates the reward variables of incentivised pools
  - Sets the amount of Tribe issued per block by the Tribal Chief to effectively zero

  It also removes CREAM from the Collaterisation Oracle
  `
};

export default end_tribe_incentives;
