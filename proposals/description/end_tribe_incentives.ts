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
    ////  Unlock pools all pools to allow principle withdrawal
    {
      target: 'tribalChief',
      values: '0',
      method: 'unlockPool(uint256)',
      arguments: ['0'],
      description: 'Unlock pool 0'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'unlockPool(uint256)',
      arguments: ['1'],
      description: 'Unlock pool 1'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'unlockPool(uint256)',
      arguments: ['2'],
      description: 'Unlock pool 2'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'unlockPool(uint256)',
      arguments: ['3'],
      description: 'Unlock pool 3'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'unlockPool(uint256)',
      arguments: ['4'],
      description: 'Unlock pool 4'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'unlockPool(uint256)',
      arguments: ['5'],
      description: 'Unlock pool 5'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'unlockPool(uint256)',
      arguments: ['6'],
      description: 'Unlock pool 6'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'unlockPool(uint256)',
      arguments: ['7'],
      description: 'Unlock pool 7'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'unlockPool(uint256)',
      arguments: ['8'],
      description: 'Unlock pool 8'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'unlockPool(uint256)',
      arguments: ['9'],
      description: 'Unlock pool 9'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'unlockPool(uint256)',
      arguments: ['10'],
      description: 'Unlock pool 10'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'unlockPool(uint256)',
      arguments: ['11'],
      description: 'Unlock pool 11'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'unlockPool(uint256)',
      arguments: ['12'],
      description: 'Unlock pool 12'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'unlockPool(uint256)',
      arguments: ['13'],
      description: 'Unlock pool 13'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'unlockPool(uint256)',
      arguments: ['14'],
      description: 'Unlock pool 14'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'unlockPool(uint256)',
      arguments: ['15'],
      description: 'Unlock pool 15'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'unlockPool(uint256)',
      arguments: ['16'],
      description: 'Unlock pool 16'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'unlockPool(uint256)',
      arguments: ['17'],
      description: 'Unlock pool 17'
    },

    //////// Set Pool allocation points to 0. This also updates reward variables
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['0', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 0 rewards to 0 to allow principle withdrawal and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['1', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 1 rewards to 0 to allow principle withdrawal and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['2', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 2 rewards to 0 to allow principle withdrawal and do not overwrite or change the rewarder'
    },

    // Note: Setting a single pool here to have an AP point != 0
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['3', '1', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 3 rewards to 1 to allow principle withdrawal and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['4', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 4 rewards to 0 to allow principle withdrawal and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['5', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 5 rewards to 0 to allow principle withdrawal and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['6', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 6 rewards to 0 to allow principle withdrawal and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['7', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 7 rewards to 0 to allow principle withdrawal and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['8', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 8 rewards to 0 to allow principle withdrawal and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['9', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 9 rewards to 0 to allow principle withdrawal and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['10', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 10 rewards to 0 to allow principle withdrawal and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['11', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 11 rewards to 0 to allow principle withdrawal and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['12', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 12 rewards to 0 to allow principle withdrawal and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['13', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 13 rewards to 0 to allow principle withdrawal and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['14', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 14 rewards to 0 to allow principle withdrawal and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['15', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 15 rewards to 0 to allow principle withdrawal and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['16', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 16 rewards to 0 to allow principle withdrawal and do not overwrite or change the rewarder'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['17', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Pool 17 rewards to 0 to allow principle withdrawal and do not overwrite or change the rewarder'
    },

    ////  Set block rewards to effectively 0
    {
      target: 'tribalChief',
      values: '0',
      method: 'updateBlockReward(uint256)',
      arguments: ['100000'],
      description: 'Set Tribal Chief block reward effectively to zero. Setting to 100000'
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
  - Unlocks all pools to allow principle to be withdrawn
  - Sets the allocation points of all pools effectively to 0
  - Updates the reward variables of incentivised pools
  - Sets the amount of Tribe issued per block by the Tribal Chief to effectively zero

  It also removes CREAM from the Collaterisation Oracle
  `
};

export default end_tribe_incentives;
