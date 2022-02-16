import { ProposalDescription } from '@custom-types/types';

const fip_x: ProposalDescription = {
  title: 'FIP-79c: Migrate proxy admins from oldTimelock',
  commands: [
    {
      target: 'feiDAO',
      values: '0',
      method: 'updateTimelock(address)',
      arguments: ['{timelock}'],
      description: 'Switch the FEI DAO from the newTimelock to the oldTimelock'
    }
  ],
  description: `
  Accept the previously pending 
  `
};

export default fip_x;
