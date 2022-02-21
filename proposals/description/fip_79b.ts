import { ProposalDescription } from '@custom-types/types';

const fip_79b: ProposalDescription = {
  title: 'FIP-79b: Restore newTimelock to FeiDAO',
  commands: [
    {
      target: 'proxyAdmin',
      values: '0',
      method: 'transferOwnership(address)',
      arguments: ['{feiDAOTimelock}'],
      description: 'Transfer ownership of proxyAdmin from oldTimelock to newTimelock'
    },
    {
      target: 'timelock',
      values: '0',
      method: 'setDelay(uint256)',
      arguments: ['0'],
      description: 'Set delay for execution on oldTimelock to 0'
    },
    {
      target: 'timelock',
      values: '0',
      method: 'setPendingAdmin(address)',
      arguments: ['{feiDAOTimelock}'],
      description:
        'Set the pending admin on the oldTimeLock to be the newTimelock. Will later need accepting by newTimelock'
    },
    {
      target: 'feiDAO',
      values: '0',
      method: 'updateTimelock(address)',
      arguments: ['{feiDAOTimelock}'],
      description: 'Reinstate the FEI DAO timelock as the newTimelock, from the oldTimelock'
    }
  ],
  description: `
  Migrate all proxies and contracts which have the oldFeiTimelock as their admin or owner to the newFeiTimelock.
  This is being done to address technical debt and to allow any relevant behaviour contracts to be upgraded.
  Revert the FEI DAO back to using the newTimelock. A subsequent action will have the oldTimelock accept the 
  newTimelock as it's admin.

  For context, the FEI DAO at this stage is pointing to the oldTimelock
  `
};

export default fip_79b;
