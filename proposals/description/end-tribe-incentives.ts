import { ProposalDescription } from '@custom-types/types';

const end_tribe_incentives: ProposalDescription = {
  // Pool ID is where the pool is in the array
  title: 'TIP-109: Discontinue Tribe Incentives',
  commands: [
    {
      target: 'tribalChief',
      values: '0',
      method: 'massUpdatePools(uint256[])',
      arguments: [['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17']],
      description: 'Update reward variables on all pools registered for Tribe rewards'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'updateBlockReward(uint256)',
      arguments: ['0'],
      description: 'Set Tribal Chief block reward to 0'
    }
  ],
  description: `
  TIP-109: Discontinue Tribe Incentives

  This proposal will disable all Tribe incentives. It updates the reward variables of incentivised pools and then
  sets the amount of Tribe issued per block by the Tribal Chief to 0.
  `
};

export default end_tribe_incentives;
