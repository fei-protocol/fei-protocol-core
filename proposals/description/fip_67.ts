import { ProposalDescription } from '@custom-types/types';

const fip_67: ProposalDescription = {
  title: 'FIP-65: Tribe ETH Fuse Pool, FIP-67: Create Backup LUSD PSM',
  commands: [
    /// CR Oracle ops
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{lusdPSM}'],
      description: 'Add LUSD PSM to cr oracle'
    },
    /// Pause LUSD PCV Drip Controller
    {
      target: 'lusdPCVDripController',
      values: '0',
      method: 'pause()',
      arguments: [],
      description: 'Pause LUSD PCVDripController'
    },
    /// Pause LUSD PCV Drip Controller
    {
      target: 'lusdPSMFeiSkimmer',
      values: '0',
      method: 'pause()',
      arguments: [],
      description: 'Pause LUSD PSM Fei Skimmer'
    },
    /// Pause Both Minting and Redemptions
    {
      target: 'lusdPSM',
      values: '0',
      method: 'pause()',
      arguments: [],
      description: 'Pause LUSD PSM'
    },
    {
      target: 'lusdPSM',
      values: '0',
      method: 'pauseRedeem()',
      arguments: [],
      description: 'Pause redemptions on Eth PSM'
    },
    /// Manage roles
    {
      target: 'core',
      values: '0',
      method: 'grantMinter(address)',
      arguments: ['{lusdPSM}'],
      description: 'Grant LUSD PSM minter role'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantPCVController(address)',
      arguments: ['{lusdPCVDripController}'],
      description: 'Grant lusdPCVDripController PCV controller role'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantPCVController(address)',
      arguments: ['{lusdPSMFeiSkimmer}'],
      description: 'Grant lusdPSMFeiSkimmer PCV controller role'
    },
    /// pcv guardian
    {
      target: 'pcvGuardian',
      values: '0',
      method: 'setSafeAddress(address)',
      arguments: ['{lusdPSM}'],
      description: 'Set the LUSD PSM as a safe address'
    },
    /// FIP-65
    {
      target: 'compoundEthPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{rariPool146EthPCVDeposit}', '2500000000000000000000'],
      description: 'withdraw 2500 ETH to rariPool146 ETH PCV Deposit'
    },
    {
      target: 'rariPool146EthPCVDeposit',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'deposit on rari pool 146 ETH PCV Deposit'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{rariPool146EthPCVDeposit}'],
      description: 'Add rari pool 146 ETH PCV Deposit to cr oracle'
    }
  ],
  description: `
  FIP 65 sends 2500 ETH from Compound to the Tribe ETH Fuse pool. This allows for levering on stETH interest rates.

  Forum: https://tribe.fei.money/t/fip-65-tribe-eth-fuse-pool/3862

  FIP-67 proposal deploys a backup LUSD PSM, initially paused:
  1. Add the LUSD PSM to the CR Oracle
  2. Pause LUSD PCVDripController
  3. Pause LUSD lusdPSMFeiSkimmer
  4. Pause minting and redemptions on the newly created lusd PSM
  5. Grant the LUSD PSM the minter role
  6. Grant PCV Controller to the lusdPCVDripController and lusdPSMFeiSkimmer

  Forum: https://tribe.fei.money/t/fip-67-backup-lusd-redeemability-module/3875
  Code: https://github.com/fei-protocol/fei-protocol-core/pull/456
`
};

export default fip_67;
