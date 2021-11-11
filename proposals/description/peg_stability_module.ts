import { ProposalDescription } from '@custom-types/types';

const peg_stability_module: ProposalDescription = {
  title: 'WETH & DAI Peg Stability Modules',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'grantMinter(address)',
      arguments: ['{wethPSM}'],
      description: 'Grant Minter Role to (w)ETH PSM'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantMinter(address)',
      arguments: ['{daiPSM}'],
      description: 'Grant Minter Role to DAI PSM'
    },
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32, bytes32)',
      arguments: [],
      description: 'Create PSM_ADMIN_ROLE'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['{feiDaoTimelock}'],
      description: 'Grant PSM_ADMIN_ROLE to Timelock'
    }
  ],
  description: 'This module is used to manage the stability of the peg.'
};

export default peg_stability_module;
