import { ProposalDescription } from '@custom-types/types';

const backstop: ProposalDescription = {
  title: 'FIP-XX: TRIBE Backstop',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0x591560f4b82b12ea68e074d47d2fecc152ba0ba0bb5d01b9d622a13a84c2bb5d',
        '0x899bd46557473cb80307a9dabc297131ced39608330a2d29b2d52b660c03923e'
      ],
      description: 'Create TRIBE_MINTER_ADMIN Role'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x591560f4b82b12ea68e074d47d2fecc152ba0ba0bb5d01b9d622a13a84c2bb5d', '{tribeReserveStabilizer}'],
      description: 'Grant TribeReserveStabilizer Admin Role'
    },
    {
      target: 'tribeMinter',
      values: '0',
      method: 'setContractAdminRole(bytes32)',
      arguments: ['0x591560f4b82b12ea68e074d47d2fecc152ba0ba0bb5d01b9d622a13a84c2bb5d'],
      description: 'Set TribeMinter Contract Admin Role'
    },
    {
      target: 'tribe',
      values: '0',
      method: 'setMinter(address)',
      arguments: ['{tribeMinter}'],
      description: 'Grant TRIBE_MINTER the Tribe Minter role'
    }
  ],
  description: `
  Code: https://github.com/fei-protocol/fei-protocol-core/pull/354
`
};

export default backstop;
