import { ProposalDescription } from '@custom-types/types';

const fip_84b: ProposalDescription = {
  title: 'FIP-84b: Restore newTimelock to FeiDAO',
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
  Forum discussion: https://tribe.fei.money/t/fip-84-migrate-upgrade-mechanism-owner/3982
  
  This FIP is the second stage in FIP 84, which changes the owner of the ProxyAdmin contract from the old, deprecated timelock 
  to the new FEI DAO timelock. This is being done to allow an incentive contract to be upgraded. 

  Specifically, this FIP 84b transfers ownership of the ProxyAdmin from the old timelock to the new timelock. 
  Following that, the timelock delay is set to 0 and a pending admin of the new timelock is set on the old timelock.
  Lastly, the FEI DAO timelock is changed back from the old timelock to the new timelock.
  
  A subsequent action will have the old timelock accept the new timelock as it's admin.
  `
};

export default fip_84b;
