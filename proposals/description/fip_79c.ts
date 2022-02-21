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
  This FIP 79c is the last stage of FIP 79. It's purpose is to have the old FEI DAO timelock 
  accept the new FEI DAO timelock as it's admin. 

  This will allow the new timelock, and by extension, the FEI DAO to perform admin level actions
  with the old timelock.
  `
};

export default fip_79c;
