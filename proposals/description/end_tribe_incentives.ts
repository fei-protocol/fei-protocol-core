import { ProposalDescription, TemplatedProposalDescription } from '@custom-types/types';

const end_tribe_incentives: TemplatedProposalDescription = {
  title: 'TIP-109: Discontinue Tribe Incentives',
  commands: [
    /////// TC grants itself TRIBAL_CHIEF_ADMIN_ROLE
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: (addresses) => [
        '0x23970cab3799b6876df4319661e6c03cc45bd59628799d92e988dd8cbdc90e31',
        addresses.tribalCouncilTimelock
      ],
      description: 'Grant TRIBAL_CHIEF_ADMIN_ROLE to Tribal Council timelock'
    },

    /////////////  Replicate onlyGovernor behaviour or resetRewards()
    //////// Set Pool allocation points to 0. This also updates reward variables

    // FEI-TRIBE LP has a single AP point
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: (addresses) => ['0', '1', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 0 rewards to 1 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: (addresses) => ['1', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 1 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: (addresses) => ['2', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 2 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: (addresses) => ['3', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 3 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: (addresses) => ['4', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 4 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: (addresses) => ['5', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 5 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: (addresses) => ['6', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 6 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: (addresses) => ['7', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 7 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: (addresses) => ['8', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 8 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: (addresses) => ['9', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 9 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: (addresses) => ['10', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 10 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: (addresses) => ['11', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 11 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: (addresses) => ['12', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 12 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: (addresses) => ['13', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 13 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: (addresses) => ['14', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 14 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: (addresses) => ['15', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 15 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: (addresses) => ['16', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 16 rewards to 0 and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: (addresses) => ['17', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 17 rewards to 0 and do not overwrite or change the rewarder'
    },

    ////  Set block rewards to effectively 0
    {
      target: 'tribalChief',
      values: '0',
      method: 'updateBlockReward(uint256)',
      arguments: (addresses) => ['100000'],
      description: 'Set Tribal Chief block reward effectively to zero. Setting to 100000'
    },

    //// Sync new reward speeds on all AutoRewardDistributors
    {
      target: 'autoRewardsDistributor',
      values: '0',
      method: 'setAutoRewardsDistribution()',
      arguments: (addresses) => [],
      description: 'Sync the reward speed of the AutoRewardsDistributor'
    },
    {
      target: 'd3AutoRewardsDistributor',
      values: '0',
      method: 'setAutoRewardsDistribution()',
      arguments: (addresses) => [],
      description: 'Sync the reward speed of the d3AutoRewardsDistributor'
    },
    {
      target: 'fei3CrvAutoRewardsDistributor',
      values: '0',
      method: 'setAutoRewardsDistribution()',
      arguments: (addresses) => [],
      description: 'Sync the reward speed of the fei3CrvAutoRewardsDistributor'
    },
    {
      target: 'feiDaiAutoRewardsDistributor',
      values: '0',
      method: 'setAutoRewardsDistribution()',
      arguments: (addresses) => [],
      description: 'Sync the reward speed of the feiDaiAutoRewardsDistributor'
    },
    {
      target: 'feiUsdcAutoRewardsDistributor',
      values: '0',
      method: 'setAutoRewardsDistribution()',
      arguments: (addresses) => [],
      description: 'Sync the reward speed of the feiUsdcAutoRewardsDistributor'
    },
    ///// Deprecate roles of Incentives system
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [
        '0x7f85477db6c0857f19179a2b3846a7ddbc64caeeb3a02ef34771b82f5ab926e4', // FUSE_ADMIN
        addresses.tribalChiefSyncV2
      ],
      description: 'Revoke FUSE_ADMIN from tribalChiefSyncV2'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [
        '0x23970cab3799b6876df4319661e6c03cc45bd59628799d92e988dd8cbdc90e31', // TRIBAL_CHIEF_ADMIN_ROLE
        addresses.tribalChiefSyncV2
      ],
      description: 'Revoke TRIBAL_CHIEF_ADMIN_ROLE from tribalChiefSyncV2'
    },

    // Deprecate RewardDistributorAdmin internal roles
    {
      target: 'rewardsDistributorAdmin',
      values: '0',
      method: 'becomeAdmin()',
      arguments: (addresses) => [],
      description:
        'Grant the TC timelock the DEFAULT_ADMIN_ROLE, to it can dismantle the RewardDistributorAdmin permissions'
    },
    {
      target: 'rewardsDistributorAdmin',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [
        '0x19cca239eaee0f28c6ba4c8c860332b8a23b35008b89b0507b96138ca5691cbb', // AUTO_REWARDS_DISTRIBUTOR_ROLE
        addresses.feiDaiAutoRewardsDistributor
      ],
      description: 'Revoke AUTO_REWARDS_DISTRIBUTOR_ROLE from feiDaiAutoRewardsDistributor'
    },
    {
      target: 'rewardsDistributorAdmin',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [
        '0x19cca239eaee0f28c6ba4c8c860332b8a23b35008b89b0507b96138ca5691cbb', // AUTO_REWARDS_DISTRIBUTOR_ROLE
        addresses.feiUsdcAutoRewardsDistributor
      ],
      description: 'Revoke AUTO_REWARDS_DISTRIBUTOR_ROLE from feiUsdcAutoRewardsDistributor'
    },
    {
      target: 'rewardsDistributorAdmin',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [
        '0x19cca239eaee0f28c6ba4c8c860332b8a23b35008b89b0507b96138ca5691cbb', // AUTO_REWARDS_DISTRIBUTOR_ROLE
        addresses.autoRewardsDistributor
      ],
      description: 'Revoke AUTO_REWARDS_DISTRIBUTOR_ROLE from autoRewardsDistributor'
    },
    {
      target: 'rewardsDistributorAdmin',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [
        '0x19cca239eaee0f28c6ba4c8c860332b8a23b35008b89b0507b96138ca5691cbb', // AUTO_REWARDS_DISTRIBUTOR_ROLE
        addresses.d3AutoRewardsDistributor
      ],
      description: 'Revoke AUTO_REWARDS_DISTRIBUTOR_ROLE from d3AutoRewardsDistributor'
    },
    {
      target: 'rewardsDistributorAdmin',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [
        '0x19cca239eaee0f28c6ba4c8c860332b8a23b35008b89b0507b96138ca5691cbb', // AUTO_REWARDS_DISTRIBUTOR_ROLE
        addresses.fei3CrvAutoRewardsDistributor
      ],
      description: 'Revoke AUTO_REWARDS_DISTRIBUTOR_ROLE from fei3CrvAutoRewardsDistributor'
    },

    //// Revoke VOTIUM_ROLE, no longer needed
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [
        '0x2d46c62aa6fbc9b550f22e00476aebb90f4ea69cd492a68db4d444217763330d', // VOTIUM_ADMIN_ROLE
        addresses.opsOptimisticTimelock
      ],
      description: 'Revoke VOTIUM_ROLE from opsOptimisticTimelock as no longer required'
    },

    ////// Remove CREAM from CR
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposit(address)',
      arguments: (addresses) => [addresses.creamDepositWrapper],
      description: 'Remove empty CREAM deposit from the CR oracle'
    }
  ],
  description: `
  TIP-109: Discontinue Tribe Incentives

  This proposal will disable all Tribe incentives. Specifically it:
  - Sets the allocation points of all pools effectively to 0
  - Updates the reward variables of incentivised pools
  - Sets the amount of Tribe issued per block by the Tribal Chief to effectively zero
  - Dismantle internal ACL/permission mapping of the rewardsDistributorAdmin
  - Sync all AutoRewardDistributors
  - Revoke TribeRoles from incentives system

  It also removes CREAM from the Collaterisation Oracle
  `
};

export default end_tribe_incentives;
