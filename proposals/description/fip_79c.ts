import { ProposalDescription } from '@custom-types/types';

const fip_79c: ProposalDescription = {
  title: 'FIP-79c: Accept newTimelock admin as the admin for the oldTimelock',
  commands: [
    {
      target: 'timelock',
      values: '0',
      method: 'acceptAdmin()',
      arguments: [],
      description: 'Accept the pending newTimelock as admin on the oldTimelock'
    }
  ],
  description: `
  Accept the newTimelock as the admin of the oldTimelock. Required as a seperate DAO vote, as
  this transaction has to be sent from the proposed pendingAdmin - the newTimelock.
  `
};

export default fip_79c;
