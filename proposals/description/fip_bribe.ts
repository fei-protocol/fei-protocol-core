import { ProposalDescription } from '@custom-types/types';

const fip_x: ProposalDescription = {
  title: 'FIP-X: Title',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0x13997b3993610cc1e86ae0983399e1b09b1a0c06e343c286539869193d33811e',
        '0x899bd46557473cb80307a9dabc297131ced39608330a2d29b2d52b660c03923e'
      ],
      description: 'Create VOTIUM_BRIBE_ADMIN_ROLE Role'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0x13997b3993610cc1e86ae0983399e1b09b1a0c06e343c286539869193d33811e',
        '0x6ef71cA9cD708883E129559F5edBFb9d9D5C6148' // TODO: update
      ],
      description: 'Grant VOTIUM_BRIBE_ADMIN_ROLE to Votium Bribe Admin'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'add(uint120,address,address,(uint128,uint128)[])',
      arguments: [
        '250',
        '{stakingTokenWrapperBribeD3pool}',
        '0x0000000000000000000000000000000000000000',
        [[0, 10000]]
      ],
      description: 'Add d3pool Votium Briber to tribalchief'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: [
        '1', // pid 1 = FEI-3CRV
        '750', // _allocPoint
        '0x0000000000000000000000000000000000000000', // _rewarder
        false // overwrite
      ],
      description: 'Set FEI-3CRV pool rewards to 750 AP'
    }
  ],
  description: 'fip_x will change the game!'
};

export default fip_x;
