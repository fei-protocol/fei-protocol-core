import { TemplatedProposalDescription } from '@custom-types/types';

const empty_pcv_deposits: TemplatedProposalDescription = {
  title: 'FIP-X: Title',
  commands: [
    {
      target: '',
      values: '',
      method: '',
      arguments: (addresses) => [],
      description: ''
    }
  ],
  description: 'fip_x will change the game!'
};

export default empty_pcv_deposits;
