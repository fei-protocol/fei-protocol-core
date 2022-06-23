import { TemplatedProposalDescription } from '@custom-types/types';

const proposal: TemplatedProposalDescription = {
  title: 'TIP-110: Simplify PCV (agEUR / ANGLE)',
  commands: [
    {
      target: 'angleDelegatorPCVDeposit',
      values: '0',
      method: 'claimGaugeRewards(address)',
      arguments: (addresses) => [
        addresses.angleGaugeUniswapV2FeiAgEur // gauge
      ],
      description: 'Claim all unclaimed ANGLE rewards'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.angleDelegatorPCVDeposit, // pcvDeposit
        addresses.angle, // token
        addresses.tribalCouncilSafe, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Migrate all ANGLE to TC Multisig where it can be sold'
    },
    {
      target: 'angleDelegatorPCVDeposit',
      values: '0',
      method: 'unstakeFromGauge(address,uint256)',
      arguments: (addresses) => [
        addresses.angleAgEurFeiPool, // token
        '9295203165522303785936702' // all LP tokens
      ],
      description: 'Unstake all agEUR/FEI Uniswap tokens from gauge'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.angleDelegatorPCVDeposit, // pcvDeposit
        addresses.angleAgEurFeiPool, // token
        addresses.agEurUniswapPCVDeposit, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Move all agEUR/FEI Uniswap tokens to PCV deposit'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatio(address,address,uint256)',
      arguments: (addresses) => [
        addresses.agEurUniswapPCVDeposit, // pcvDeposit
        addresses.agEurUniswapPCVDeposit, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Remove all agEUR/FEI Uniswap liquidity & burn FEI'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.agEurUniswapPCVDeposit, // pcvDeposit
        addresses.agEUR, // token
        addresses.angleEuroRedeemer, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Move all agEUR to redeemer'
    },
    {
      target: 'angleEuroRedeemer',
      values: '0',
      method: 'redeem()',
      arguments: (addresses) => [],
      description: 'Redeem all agEUR for FEI and DAI and send to DAI PSM'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposits(address[])',
      arguments: (addresses) => [[addresses.agEurUniswapPCVDeposit, addresses.uniswapLensAgEurUniswapGauge]],
      description: 'Remove agEUR addresses from CR oracle'
    },
    {
      target: 'pcvGuardian',
      values: '0',
      method: 'unsetSafeAddress(address)',
      arguments: (addresses) => [addresses.agEurUniswapPCVDeposit],
      description: 'Remove agEurUniswapPCVDeposit from safe addresses'
    }
  ],
  description: `TIP-110: Simplify PCV (agEUR / ANGLE)

Convert all agEUR in the PCV to DAI, and deprecate all Angle Protocol-related contracts, except the contract that is holding vote-escrowed ANGLE.

This proposal will perform the following actions :
- Move all ANGLE rewards to TC Multisig where they can be sold
- Unstake from Angle Protocol's Gauge all agEUR/FEI Uniswap tokens
- Move all agEUR/FEI Uniswap tokens to PCV deposit
- Remove all agEUR/FEI Uniswap liquidity & burn FEI
- Redeem agEUR for DAI, and send proceeds to DAI PSM
- Unset agEUR safe addresses & CR oracle entries
`
};

export default proposal;
