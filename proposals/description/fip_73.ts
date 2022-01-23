import { ProposalDescription } from '@custom-types/types';

const fip_73: ProposalDescription = {
  title: 'Fei Peg Policy Changes',
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
      target: 'lusdPSM',
      values: '0',
      method: 'setMintFee(uint256)',
      arguments: ['25'],
      description: 'Set LUSD PSM mint fee to 0.25%'
    },
    {
      target: 'lusdPSM',
      values: '0',
      method: 'setRedeemFee(uint256)',
      arguments: ['25'],
      description: 'Set LUSD PSM redeem fee to 0.25%'
    }
  ],
  description: `
Forum discussion: https://tribe.fei.money/t/fei-peg-policy-changes/3906
Snapshot: https://snapshot.org/#/fei.eth/proposal/0xb313a773d8f9dc28aca6e637b625959851cce4e5a19d9e2ebde7a14c057d5d2b

- Grant OA timelock the PCV_GUARDIAN_ADMIN_ROLE role, so it can add safe withdrawal addresses to the PCVGuardian.
- Allow movement between Convex and Curve d3pool deposits, where the PCVGuardian will be able to withdraw FEI out of circulation if needed.
- Parameter adjustments on the ETH PSM (increase reserve threshold from 250 ETH to 5000 ETH)
- Parameter adjustments on the LUSD PSM (reduce mint and redeem fee to 25 bps, down from 50 bps)
`
};

export default fip_73;
