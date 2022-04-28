import { ProposalDescription } from '@custom-types/types';

const fip_94: ProposalDescription = {
  title: 'FIP-94: Remove GOVERN_ROLE role from Rari timelock',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: [
        '0x899bd46557473cb80307a9dabc297131ced39608330a2d29b2d52b660c03923e', // GOVERN_ROLE
        '{rariTimelock}'
      ],
      description: 'Revoke GOVERN_ROLE role from Rari timelock'
    }
  ],
  description: `
  This FIP revokes the GOVERN_ROLE role from the Rari timelock as a safety mechanism.`
};

export default fip_94;
