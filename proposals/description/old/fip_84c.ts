import { ProposalDescription } from '@custom-types/types';

const fip_84c: ProposalDescription = {
  title: 'FIP-84c: Accept newTimelock admin as the admin for the oldTimelock',
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
  Forum discussion: https://tribe.fei.money/t/fip-84-migrate-upgrade-mechanism-owner/3982
  
  This FIP 84c is the last stage of FIP 84. It's purpose is to have the old timelock 
  accept the new FEI DAO timelock as it's admin. 

  This will allow the new timelock, and by extension, the FEI DAO to perform admin level actions
  with the old timelock.
  `
};

export default fip_84c;
