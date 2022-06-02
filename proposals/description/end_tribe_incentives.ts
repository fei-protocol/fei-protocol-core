import { ProposalDescription } from '@custom-types/types';

const end_tribe_incentives: ProposalDescription = {
  // Pool ID is where the pool is in the array
  title: 'TIP-109: Discontinue Tribe Incentives',
  commands: [
    /////  Update reward variables of all pools
    {
      target: 'tribalChief',
      values: '0',
      method: 'massUpdatePools(uint256[])',
      arguments: [['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17']],
      description: 'Update reward variables on all pools registered for Tribe rewards'
    },

    ////  Set Pool allocation points to 0 and unlock
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['0'],
      description: 'Set Pool 0 rewards to 0 and unlock the pool, to allow principle withdrawal'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['1'],
      description: 'Set Pool 1 rewards to 0 and unlock the pool, to allow principle withdrawal'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['2'],
      description: 'Set Pool 2 rewards to 0 and unlock the pool, to allow principle withdrawal'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['3'],
      description: 'Set Pool 3 rewards to 0 and unlock the pool, to allow principle withdrawal'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['4'],
      description: 'Set Pool 4 rewards to 0 and unlock the pool, to allow principle withdrawal'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['5'],
      description: 'Set Pool 5 rewards to 0 and unlock the pool, to allow principle withdrawal'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['6'],
      description: 'Set Pool 6 rewards to 0 and unlock the pool, to allow principle withdrawal'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['7'],
      description: 'Set Pool 7 rewards to 0 and unlock the pool, to allow principle withdrawal'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['8'],
      description: 'Set Pool 8 rewards to 0 and unlock the pool, to allow principle withdrawal'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['9'],
      description: 'Set Pool 9 rewards to 0 and unlock the pool, to allow principle withdrawal'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['10'],
      description: 'Set Pool 10 rewards to 0 and unlock the pool, to allow principle withdrawal'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['11'],
      description: 'Set Pool 11 rewards to 0 and unlock the pool, to allow principle withdrawal'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['12'],
      description: 'Set Pool 12 rewards to 0 and unlock the pool, to allow principle withdrawal'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['13'],
      description: 'Set Pool 13 rewards to 0 and unlock the pool, to allow principle withdrawal'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['14'],
      description: 'Set Pool 14 rewards to 0 and unlock the pool, to allow principle withdrawal'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['15'],
      description: 'Set Pool 15 rewards to 0 and unlock the pool, to allow principle withdrawal'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['16'],
      description: 'Set Pool 16 rewards to 0 and unlock the pool, to allow principle withdrawal'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['17'],
      description: 'Set Pool 17 rewards to 0 and unlock the pool, to allow principle withdrawal'
    },

    //// Leave one pool with a non-zero AP allocation, but effectively zero
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['3', '1', '0x0000000000000000000000000000000000000000', false],
      description: 'Set Fei Rari pool AP points to 1. Do not set the rewarder, overwrite is false'
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
  - Sets the allocation points of all pools effectively to 0
  - Updates the reward variables of incentivised pools
  - Sets the amount of Tribe issued per block by the Tribal Chief to effectively zero

  It also removes CREAM from the Collaterisation Oracle
  `
};

export default end_tribe_incentives;
