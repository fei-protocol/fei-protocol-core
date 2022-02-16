import { ProposalDescription } from '@custom-types/types';

const fip_x: ProposalDescription = {
  title: 'FIP-79b: Restore newTimelock to FeiDAO',
  commands: [
    {
      target: 'feiDAO',
      values: '0',
      method: 'updateTimelock(address)',
      arguments: ['{feiDAOTimelock}'],
      description: 'Reinstate the FEI DAO timelock as the newTimelock, from the oldTimelock'
    },
    {
      target: 'timelock',
      values: '0',
      method: 'acceptAdmin()',
      arguments: [''],
      description: 'Accept the pending newTimelock as admin on the oldTimelock'
    }
  ],
  description: `
  Reinstate the newTimelock as the FEI DAO timelock - it was temporarily set to the oldTimelock in fip_79a.
  Accept the newTimelock as the admin of the oldTimelock
  `
};

export default fip_x;
