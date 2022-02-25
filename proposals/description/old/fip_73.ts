import { ProposalDescription } from '@custom-types/types';

const fip_73: ProposalDescription = {
  title: 'FIP-73: Fei Peg Policy Changes',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0xdf6ce05acd28d71e96472375ef55c4a692f167af3ccda9500570f7373c1ba22c', // PCV_GUARDIAN_ADMIN_ROLE
        '0x899bd46557473cb80307a9dabc297131ced39608330a2d29b2d52b660c03923e' // GOVERN_ROLE
      ],
      description: 'Create PCV_GUARDIAN_ADMIN_ROLE role'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0xdf6ce05acd28d71e96472375ef55c4a692f167af3ccda9500570f7373c1ba22c', '{optimisticTimelock}'],
      description: 'Grant OA Timelock the PCV_GUARDIAN_ADMIN_ROLE role'
    },
    {
      target: 'pcvGuardian',
      values: '0',
      method: 'setSafeAddress(address)',
      arguments: ['{d3poolCurvePCVDeposit}'],
      description: 'Set d3pool Curve deposit as safe address'
    },
    {
      target: 'pcvGuardian',
      values: '0',
      method: 'setSafeAddress(address)',
      arguments: ['{d3poolConvexPCVDeposit}'],
      description: 'Set d3pool Convex deposit as safe address'
    },
    {
      target: 'ethPSM',
      values: '0',
      method: 'setReservesThreshold(uint256)',
      arguments: ['5000000000000000000000'],
      description: 'Set ETH psm reserve threshold to 5000 ETH (up from 250 ETH)'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{wethDepositWrapper}'],
      description: 'Add WETH lens to DAO timelock'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{dpiDepositWrapper}'],
      description: 'Add DPI lens to DAO timelock'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{raiDepositWrapper}'],
      description: 'Add RAI lens to DAO timelock'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{agEurDepositWrapper}'],
      description: 'Add agEUR lens to DAO timelock'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0xc307c44629779eb8fc0b85f224c3d22f5876a6c84de0ee42d481eb7814f0d3a8', '{opsOptimisticTimelock}'],
      description: 'Grant ORACLE_ADMIN_ROLE to OPS OA Timelock'
    }
  ],
  description: `
Forum discussion: https://tribe.fei.money/t/fei-peg-policy-changes/3906
Snapshot: https://snapshot.org/#/fei.eth/proposal/0xb313a773d8f9dc28aca6e637b625959851cce4e5a19d9e2ebde7a14c057d5d2b

- Grant OA timelock the PCV_GUARDIAN_ADMIN_ROLE role, so it can add safe withdrawal addresses to the PCVGuardian.
- Grant OA OPS timelock the ORACLE_ADMIN_ROLE role, to be more reactive on oracle updates if needed (1 day timelock instead of 4 days)
- Allow movement between Convex and Curve d3pool deposits, where the PCVGuardian will be able to take FEI out of circulation if needed by using the PCV FRAX and alUSD.
- Parameter adjustments on the ETH PSM (increase reserve threshold from 250 ETH to 5000 ETH, to match dripper size)
- Add ERC20 lenses for WETH, DPI, RAI, and agEUR on the DAO Timelock, so they are still accounted in PCV, if they need to be moved there by the guardian.
`
};

export default fip_73;
