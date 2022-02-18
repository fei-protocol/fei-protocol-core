import { ProposalDescription } from '@custom-types/types';

const fip_79a: ProposalDescription = {
  title: 'FIP-79a: Change FEI DAO timelock to previous timelock. Grant Rari timelock governor',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0x899bd46557473cb80307a9dabc297131ced39608330a2d29b2d52b660c03923e', // GOVERN_ROLE
        '{rariTimelock}'
      ],
      description: 'Grant Rari Timelock the GOVERN_ROLE role'
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
  Grant the Rari Timelock the GOVERN_ROLE role, as a safety and fallback mechanism during the 
  proxy migration process. In addition, change the feiDAO to point to and use the oldTimelock.
  `
};

export default fip_79a;
