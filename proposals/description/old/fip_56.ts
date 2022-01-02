import { ProposalDescription } from '@custom-types/types';

const fip_56: ProposalDescription = {
  title: 'FIP-56: Fei v2 Deployment',
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
      arguments: ['{daiPSM}', '20000000000000000000000000'],
      description: 'Send 20m DAI to the DAI PSM'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeMinter(address)',
      arguments: ['{dpiBondingCurve}'],
      description: 'Revoke minter from dpiBondingCurve'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeMinter(address)',
      arguments: ['{raiBondingCurve}'],
      description: 'Revoke minter from raiBondingCurve'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposits(address[])',
      arguments: [['{dpiBondingCurveWrapper}', '{raiBondingCurveWrapper}']],
      description: 'Remove Old PCV Deposits from Collateralization Oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposits(address[])',
      arguments: [['{daiPSM}']],
      description: 'Add New PCV Deposits to Collateralization Oracle'
    },
    {
      target: 'bondingCurve',
      values: '0',
      method: 'setBuffer(uint256)',
      arguments: ['75'],
      description: 'Set Bonding Curve buffer to 75bps'
    },
    {
      target: 'ethReserveStabilizer',
      values: '0',
      method: 'setUsdPerFeiRate(uint256)',
      arguments: ['9925'],
      description: 'Set EthReserveStabilizer exchange rate to $0.9925'
    },
    {
      target: 'pcvGuardian',
      values: '0',
      method: 'setSafeAddress(address)',
      arguments: ['{daiPSM}'],
      description: 'Add DAI PSM to PCV Guardian'
    }
  ],
  description: `
  Adds the following contracts to PCV:
  * TribeMinter - mints TRIBE with an annual inflation limit
  * TribeReserveStabilizer - backstop for when PCV is under reserve ratio
  * DAI PSM - 1:1 redeemability for FEI and DAI
  * DAI PCV Drip Controller - refills DAI PSM periodically

  removes minting privileges and CR oracle for DPI and RAI bomding curves
  Increase ETH spread to 75bps
  Add DAI PSM to PCV Guardian

  Forum: https://tribe.fei.money/t/fip-56-fei-v2-deployment-proposal/3768
  Code: https://github.com/fei-protocol/fei-protocol-core/pull/372
`
};

export default fip_56;
