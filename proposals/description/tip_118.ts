import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

const tip_118: TemplatedProposalDescription = {
  title: 'TIP_118: Deploy ERC20 Holding Deposits, deprecate unused PSMs',
  commands: [
    // 1. Transfer all assets off the PSMs to the new empty PCV deposits
    // ETH PSM
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.ethPSM, // pcvDeposit
        addresses.weth, // token
        addresses.wethHoldingDeposit, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Migrate WETH from the ETH PSM to the new WETH Holding PCV deposit'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.ethPSM, // pcvDeposit
        addresses.fei, // token
        addresses.daiFixedPricePSM, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Migrate FEI from ETH PSM to the DAI PSM'
    },

    // LUSD_PSM
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.lusdPSM, // pcvDeposit
        addresses.lusd, // token
        addresses.lusdHoldingDeposit, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Migrate LUSD from the LUSD PSM to the LUSD holding PCV deposit'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.lusdPSM, // pcvDeposit
        addresses.fei, // token
        addresses.daiFixedPricePSM, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Migrate FEI from the LUSD PSM to the DAI PSM'
    },

    // RAI_PSM
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.raiPriceBoundPSM, // pcvDeposit
        addresses.rai, // token
        addresses.raiHoldingDeposit, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Migrate RAI from the RAI PSM to the RAI holding PCV deposit'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.raiPriceBoundPSM, // pcvDeposit
        addresses.fei, // token
        addresses.daiFixedPricePSM, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Migrate FEI from the RAI PSM to the DAI PSM'
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

    // 3. Pause all unpaused functionality on the PSMs
    {
      target: 'raiPriceBoundPSM',
      values: '0',
      method: 'pauseRedeem()',
      arguments: (addresses) => [],
      description: 'Pause redemptions on the Rai Price bound PSM'
    },

    ///  PCV DRIP CONTROLLERS
    {
      target: 'aaveEthPCVDripController',
      values: '0',
      method: 'pause()',
      arguments: (addresses) => [],
      description: 'Pause the ETH PCV drip controller'
    },
    {
      target: 'raiPCVDripController',
      values: '0',
      method: 'pause()',
      arguments: (addresses) => [],
      description: 'Pause the RAI PCV drip controller'
    },
    {
      target: 'lusdPCVDripController',
      values: '0',
      method: 'pause()',
      arguments: (addresses) => [],
      description: 'Pause the LUSD PCV drip controller'
    }
  ],
  description: `
  TIP_118: Deploy ERC20 Holding Deposits, deprecate unused PSMs

  This proposal deploys a new type of PCV deposit, the ERC20HoldingPCVDeposit. This is a deposit which has 
  the deposit() method as a no-op and is intended to just hold assets. 

  In addition, it also deprecates the ETH, LUSD and RAI PSMs. This involves transferring all assets off these PSMs, 
  revoking their MINTER_ROLE, ensuring they are fully paused and pausing the associated PCV drip controllers.
  
  Going forward, the only active PSM will be the DAI PSM.
  `
};

export default tip_118;