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
    },
    {
      target: 'compoundDaiPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{daiPSM}', '30000000000000000000000000'],
      description: 'Send 30m DAI to the DAI PSM'
    },
    {
      target: 'aaveEthPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{daiPSM}', '7500000000000000000000'],
      description: 'Send 7500 WETH to the WETH PSM'
    }
  ],
  description: 'This module is used to manage the stability of the peg.'
};

export default peg_stability_module;
