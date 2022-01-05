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
      target: 'ethPSM',
      values: '0',
      method: 'secondaryPause()',
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
    {
      target: 'aaveEthPCVDripController',
      values: '0',
      method: 'setDripAmount(uint256)',
      arguments: ['1000000000000000000000'],
      description: 'Lower drip amount from 5k to 1k eth'
    }
  ],
  description: `
  This proposal includes several maintenance upgrades that are bundled together:
  1. Update the Collateralization Oracle to remove Eth Reserve Stabilizer and Eth Bonding Curve and add the new Eth PSM
  2. Deprecate Eth bonding curve + Eth Reserve Stabilizer by removing Minter role and pausing the contracts
  3. Grant the Eth PSM the minter role
  4. Secondary pause the Eth PSM so that redemptions cannot take place

  Code: https://github.com/fei-protocol/fei-protocol-core/pull/411
`
};

export default fip_62;
