import { ProposalDescription } from '@custom-types/types';

const fip_84a: ProposalDescription = {
  title: 'FIP-84a: Change FEI DAO timelock to previous timelock. Grant Rari timelock governor',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0x899bd46557473cb84307a9dabc297131ced39608330a2d29b2d52b660c03923e', // GOVERN_ROLE
        '{rariTimelock}'
      ],
      description: 'Grant Rari Timelock the GOVERN_ROLE role'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeGovernor(address)',
      arguments: ['{timelock}'],
      description: 'Revoke GOVERN_ROLE from the oldTimelock. Safety mechanism during the proxy migration'
    },
    {
      target: 'feiDAO',
      values: '0',
      method: 'updateTimelock(address)',
      arguments: ['{timelock}'],
      description: 'Switch the FEI DAO from the newTimelock to the oldTimelock'
    }
  ],
  description: `
  FIP 84 is being performed to allow an incentives contract to be upgraded. 

  Specifically, to distribute rewards on Aave we deploy an incentives controller contract. That 
  contract has an upgrade mechanism managed by a ProxyAdmin contract. To participate in the next round
  of Aave rewards there is a need to upgrade to a compatible incentives contract. 

  However currently, the owner of the ProxyAdmin contract is the previous old timelock that the Fei DAO 
  used. Only the owner of the ProxyAdmin is able to upgrade a contract it manages. 

  Therefore, this FIP is being used to change the ProxyAdmin contract to the new Fei DAO timelock. To do this,
  we have to temporarily switch the DAO timelock back to the old timelock and so this FIP comes in three stages:
  a, b, c. 

  FIP 84a specifically changes the FEI DAO to point to and use the old timelock for migration purposes. It also
  grants the Rari Timelock the GOVERN_ROLE role and revokes the GOVERN_ROLE from the old timelock as
  as safety and fallback mechanims. 
  `
};

export default fip_84a;
