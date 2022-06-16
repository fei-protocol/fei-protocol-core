import { ProposalDescription } from '@custom-types/types';

const deprecate_incentives: ProposalDescription = {
  title: 'TIP-114: Deprecate TRIBE Incentives system',
  commands: [
    {
      target: 'votiumBriber3Crvpool',
      values: '0',
      method: '',
      arguments: [],
      description: ''
    }
  ],
  description: `
  TIP-114: Deprecate TRIBE Incentives system

  Deprecates the TRIBE incentives system according to proposal: 

  Specifically it:
  - Fully funds all remaining auto reward distributors via their staking token wrappers
  - Withdraws remaining TRIBE from the TribalChief, leaving enough behind to fully fund existing commitments
  - Withdraws $50k TRIBE from 3Crv Votium briber contract
  - Withdraws remaining TRIBE from Aave incentives
  `
};

export default deprecate_incentives;
