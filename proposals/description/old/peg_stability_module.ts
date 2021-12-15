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
      method: 'grantPCVController(address)',
      arguments: ['{wethPCVDripController}'],
      description: 'Give the WETH PCVDripController the PCVController role so that it can withdraw from AAVE'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantPCVController(address)',
      arguments: ['{daiPCVDripController}'],
      description: 'Give the DAI PCVDripController the PCVController role so that it can withdraw from Compound'
    },
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0x1749ca1ca3564d20da6efea465c2a5ae869a9e4b006da7035e688beb14d704e0',
        '0x899bd46557473cb80307a9dabc297131ced39608330a2d29b2d52b660c03923e'
      ],
      description: 'Create PSM_ADMIN_ROLE'
    },
    {
      target: 'compoundDaiPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{daiPSM}', '10000000000000000000000000'],
      description: 'Send 10m DAI to the DAI PSM'
    },
    {
      target: 'aaveEthPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{wethPSM}', '2500000000000000000000'],
      description: 'Send 2500 WETH to the WETH PSM'
    }
  ],
  description: 'This module is used to manage the stability of the peg.'
};

export default peg_stability_module;
