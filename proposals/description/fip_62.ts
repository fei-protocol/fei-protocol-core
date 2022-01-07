import { ProposalDescription } from '@custom-types/types';

const fip_62: ProposalDescription = {
  title: 'FIP-62: Create ETH PSM and Deprecate Eth Reserve Stabilizer and Bonding Curve',
  commands: [
    /// CR Oracle ops
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposit(address)',
      arguments: ['{ethReserveStabilizerWrapper}'],
      description: 'Remove Eth Reserve Stabilizer Wrapper from cr oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposit(address)',
      arguments: ['{bondingCurve}'],
      description: 'Remove Eth Bonding Curve from cr oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{ethPSM}'],
      description: 'Add Eth PSM to cr oracle'
    },
    /// pull all assets out of decommissioned eth reserve stabilizer and eth bonding curve
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatio(address,address,uint256)',
      arguments: ['{ethReserveStabilizer}', '{aaveEthPCVDeposit}', '10000'],
      description: 'Pull assets out of the Eth Reserve Stabilizer and send to aaveEthPCVDeposit'
    },
    {
      target: 'bondingCurve',
      values: '0',
      method: 'allocate()',
      arguments: [],
      description: 'Pull assets out of the Eth Bonding Curve and send to aaveEthPCVDeposit'
    },
    /// Pause existing solutions
    {
      target: 'ethReserveStabilizer',
      values: '0',
      method: 'pause()',
      arguments: [],
      description: 'Pause Eth Reserve Stabilizer'
    },
    {
      target: 'bondingCurve',
      values: '0',
      method: 'pause()',
      arguments: [],
      description: 'Pause Eth Bonding Curve'
    },
    {
      target: 'aaveEthPCVDripController',
      values: '0',
      method: 'pause()',
      arguments: [],
      description: 'Pause Aave Eth PCV Drip Controller'
    },
    {
      target: 'compoundEthPCVDripController',
      values: '0',
      method: 'pause()',
      arguments: [],
      description: 'Pause Compound Eth PCV Drip Controller'
    },
    {
      target: 'ethPSM',
      values: '0',
      method: 'pauseRedeem()',
      arguments: [],
      description: 'Pause redemptions on Eth PSM'
    },
    /// Manage roles
    {
      target: 'core',
      values: '0',
      method: 'revokeMinter(address)',
      arguments: ['{bondingCurve}'],
      description: 'Deprecate Eth bonding curve by removing minter role'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantMinter(address)',
      arguments: ['{ethPSM}'],
      description: 'Grant Eth PSM minter role'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeBurner(address)',
      arguments: ['{ethReserveStabilizer}'],
      description: 'Revoke burner role from eth reserve stabilizer'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokePCVController(address)',
      arguments: ['{compoundEthPCVDripController}'],
      description: 'Revoke burner role from eth reserve stabilizer'
    },
    /// modify settings of existing PCV Drip Controller to point to the eth PSM
    {
      target: 'aaveEthPCVDripController',
      values: '0',
      method: 'setTarget(address)',
      arguments: ['{ethPSM}'],
      description: 'Set aaveEthPCVDripController target to the eth PSM'
    },
    {
      target: 'aaveEthPCVDripController',
      values: '0',
      method: 'setIncentiveAmount(uint256)',
      arguments: ['0'],
      description: 'Set incentive amount to 0'
    },
    /// pcv guardian
    {
      target: 'pcvGuardian',
      values: '0',
      method: 'setSafeAddress(address)',
      arguments: ['{ethPSM}'],
      description: 'Set the eth PSM as a safe address'
    },
    {
      target: 'pcvGuardian',
      values: '0',
      method: 'unsetSafeAddress(address)',
      arguments: ['{ethReserveStabilizer}'],
      description: 'Remove the Eth Reserve Stabilizer as a safe address'
    }
  ],
  description: `
  This proposal includes several maintenance upgrades that are bundled together:
  1. Update the Collateralization Oracle to remove Eth Reserve Stabilizer and Eth Bonding Curve and add the new Eth PSM
  2. Deprecate Eth bonding curve + Eth Reserve Stabilizer by removing Minter role and pausing the contracts
  3. Grant the Eth PSM the minter role
  4. Pause redemptions on the Eth PSM
  5. Revoke burner role from the Eth Reserve Stabilizer
  6. Revoke PCV Controller from the compoundEthPCVDripController and pause
  7. Set Eth PSM as a safe address for the PCV guardian
  8. Withdraw assets out of Eth Reserve Stabilizer and deposit them into the Aave Eth PCV Deposit

  Code: https://github.com/fei-protocol/fei-protocol-core/pull/439
`
};

export default fip_62;
