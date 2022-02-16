import { ProposalDescription } from '@custom-types/types';

const fip_x: ProposalDescription = {
  title: 'FIP-79a: Migrate proxy admins from oldTimelock',
  commands: [
    {
      target: 'feiDAO',
      values: '0',
      method: 'updateTimelock(address)',
      arguments: ['{timelock}'],
      description: 'Switch the FEI DAO timelock from the newTimelock to the oldTimelock'
    },
    {
      target: 'proxyAdmin',
      values: '0',
      method: 'changeProxyAdmin(address, address)',
      arguments: ['{aaveTribeIncentivesControllerProxy}', '{feiDAOTimelock}'],
      description: 'Change Aaave Tribal Incentives controller proxy admin from oldTimelock to newTimelock'
    },
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
    }
  ],
  description: `
  Migrate all proxies and contracts which have the oldFeiTimelock as their admin or owner to the newFeiTimelock.
  This is being done to address technical debt and to allow any relevant behaviour contracts to be upgraded.
  Involves temporarily changing the Fei DAO timelock to the oldTimelock, before a subsequent action reverts the change.
  `
};

export default fip_x;
