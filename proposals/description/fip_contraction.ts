import { ProposalDescription } from '@custom-types/types';

const fip_x: ProposalDescription = {
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
      target: 'd3poolConvexPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{d3poolCurvePCVDeposit}', '49817687278780155379999541'],
      description: 'Unstake d3pool tokens from Convex, move them to Curve deposit'
    },
    {
      target: 'ethPSM',
      values: '0',
      method: 'setReservesThreshold(uint256)',
      arguments: ['5000000000000000000000'],
      description: 'Set ETH psm reserve threshold to 5000 ETH (up from 250 ETH)'
    }
  ],
  description: `
Forum discussion: https://tribe.fei.money/t/fei-peg-policy-changes/3906
Snapshot: https://snapshot.org/#/fei.eth/proposal/0xb313a773d8f9dc28aca6e637b625959851cce4e5a19d9e2ebde7a14c057d5d2b

- Grant OA timelock the PCV_GUARDIAN_ADMIN_ROLE role, so it can add safe withdrawal addresses to the PCVGuardian.
- Unstake d3pool tokens from Convex, move them to the Curve deposit, where the PCVGuardian will be able to withdraw FEI out of circulation
- Parameter adjustments on the ETH PSM
`
};

export default fip_x;
