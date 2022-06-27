import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

const tip_118: TemplatedProposalDescription = {
  title: 'TIP_118: Deploy ERC20 Holding Deposits, deprecate unused PSMs',
  commands: [
    // 1. Move all assets off the PSMs
    {
      target: 'ethPSM',
      values: '',
      method: '',
      arguments: (addresses) => [],
      description: ''
    },
    // 2. Revoke PSM permissions
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('MINTER_ROLE'), addresses.ethPSM],
      description: 'Revoke MINTER_ROLE from ETH PSM'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('MINTER_ROLE'), addresses.lusdPSM],
      description: 'Revoke MINTER_ROLE from LUSD PSM'
    },
    // RAI PSM does not have MINTER_ROLE

    // 3. Pause the PSMs
    {
      target: 'raiPriceBoundPSM',
      values: '0',
      method: 'pauseRedeem()',
      arguments: (addresses) => [],
      description: 'Pause redemptions on the Rai Price bound PSM'
    }
  ],
  description: `
  TIP_118: Deploy ERC20 Holding Deposits, deprecate unused PSMs

  This proposal deploys a new type of PCV deposit, the ERC20HoldingPCVDeposit. This is a deposit which has 
  the deposit() method as a no-op and is intended to just hold assets. 

  In addition, it also deprecates the ETH, LUSD and RAI PSMs. This involves transferring all assets off these PSMs, 
  revoking their MINTER_ROLE and ensuring they are fully paused. 
  
  Going forward, the only active PSM will be the DAI PSM.
  `
};

export default tip_118;
