import { ProposalDescription } from '@custom-types/types';

const fip_92: ProposalDescription = {
  title: 'FIP-90: Fuse-boosted FEI/DAI/LUSD Balancer Pool',
  commands: [
    {
      target: 'bammDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{feiDAOTimelock}', '10000000000000000000000000'],
      description: 'Withdraw 10M LUSD for atomic swap'
    },
    {
      target: 'lusd',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: ['{curveLusdMetapool}', '10000000000000000000000000'],
      description: 'Approve 10M LUSD for swap on Curve'
    },
    {
      target: 'curveLusdMetapool',
      values: '0',
      method: 'exchange_underlying(int128,int128,uint256,uint256,address)',
      arguments: [
        '0', // i = LUSD
        '1', // j = DAI
        '10000000000000000000000000', // dx = 10M
        '9980000000000000000000000', // min_dy = 9.98M
        '{bbfUsdPCVDeposit}' // _receiver
      ],
      description: 'Swap 10M LUSD for at least 9.98M DAI (0.2% slippage) on Curve'
    },
    {
      target: 'bammDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{bbfUsdPCVDeposit}', '15000000000000000000000000'],
      description: 'Send 15M LUSD to BB-F-USD Deposit'
    },
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: ['{bbfUsdPCVDeposit}', '15000000000000000000000000'],
      description: 'Mint 15M FEI to the BB-F-USD Deposit'
    },
    // at this point, the BB-F-USD PCVDeposit should hold :
    // - 10M DAI
    // - 15M LUSD
    // - 15M FEI
    // -   0 BB-F-USD
    // Deposit has to happen in 3 stages (60k$, 500k$, 9M$, 45M$) otherwise
    // the pool breaks the invariant
    {
      target: 'bbfUsdPCVDeposit',
      values: '0',
      method: 'depositUnwrapped(uint256)',
      arguments: [
        '20000000000000000000000' // max. 20k of each stablecoin
      ],
      description: 'First BB-F-USD deposit() (20k each) - unwrapped'
    },
    {
      target: 'bbfUsdPCVDeposit',
      values: '0',
      method: 'depositUnwrapped(uint256)',
      arguments: [
        '2980000000000000000000000' // max. 2.98M of each stablecoin
      ],
      description: 'Second BB-F-USD deposit() (2.98M each) - unwrapped'
    },
    {
      target: 'linearBalancerPoolManager',
      values: '0',
      method: 'setTargets(address,uint256,uint256)',
      arguments: [
        '{balancerBoostedFuseDaiLinearPool}', // pool = bb-f-dai
        '2000000000000000000000000', // newLowerTarget = 2M
        '4000000000000000000000000' // newUpperTarget = 4M
      ],
      description: 'Set bb-f-DAI liquid DAI range target to [2M, 4M]' // deploy had to be [0, x]
    },
    {
      target: 'linearBalancerPoolManager',
      values: '0',
      method: 'setTargets(address,uint256,uint256)',
      arguments: [
        '{balancerBoostedFuseLusdLinearPool}', // pool = bb-f-lusd
        '2000000000000000000000000', // newLowerTarget = 2M
        '4000000000000000000000000' // newUpperTarget = 4M
      ],
      description: 'Set bb-f-LUSD liquid LUSD range target to [2M, 4M]' // deploy had to be [0, x]
    },
    {
      target: 'linearBalancerPoolManager',
      values: '0',
      method: 'setTargets(address,uint256,uint256)',
      arguments: [
        '{balancerBoostedFuseFeiLinearPool}', // pool = bb-f-fei
        '2000000000000000000000000', // newLowerTarget = 2M
        '4000000000000000000000000' // newUpperTarget = 4M
      ],
      description: 'Set bb-f-FEI liquid FEI range target to [2M, 4M]' // deploy had to be [0, x]
    },
    // at this point, the BB-F-USD PCVDeposit should hold :
    // -  7M DAI
    // - 12M LUSD
    // - 12M FEI
    // -  9M BB-F-USD (everything unwrapped)
    // Deposit has to happen in multiple stages (60k$, 500k$, 9M$...) otherwise
    // the pool breaks invariant & the tx reverts
    {
      target: 'bbfUsdPCVDeposit',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Third BB-F-USD deposit() - wrapped'
    },
    // The BB-F-USD pool should now hold :
    // - 10M DAI  (3M liquid, 7M wrapped)
    // - 15M LUSD (3M liquid, 12M wrapped)
    // - 15M FEI  (3M liquid, 12M wrapped)
    // PCVDeposit should hold 40M BB-F-USD tokens
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatio(address,address,uint256)',
      arguments: ['{rariPool8DaiPCVDeposit}', '{bbfUsdPCVDeposit}', '10000'],
      description: 'Move all ~5M DAI from FeiRari to BB-F-USD'
    },
    {
      target: 'bbfUsdPCVDeposit',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Fourth BB-F-USD deposit() - wrapped'
    },
    // BB-F-USD should now hold :
    // - 15M DAI  (3M liquid, 12M wrapped)
    // - 15M LUSD (3M liquid, 12M wrapped)
    // - 15M FEI  (3M liquid, 12M wrapped)
    // PCVDeposit should hold 45M BB-F-USD tokens
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatio(address,address,uint256)',
      arguments: ['{rariPool8LusdPCVDeposit}', '{bammDeposit}', '10000'],
      description: 'Move all ~5M LUSD from FeiRari to B.AMM'
    },
    {
      target: 'bammDeposit',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Deposit 5M LUSD that were in FeiRari in B.AMM'
    },
    {
      target: 'rariPool8FeiPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: [
        '{daiFixedPricePSM}', // the FEI surplus can be burned there
        '12000000000000000000000000'
      ],
      description: 'Withdraw 12M FEI from FeiRari to be burned'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{bbfUsdPCVDeposit}'],
      description: 'Add BB-F-USD Deposit to CR Oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'swapDeposit(address,address)',
      arguments: ['{balancerLensBpt30Fei70Weth}', '{balancerLensBpt30Fei70WethFixed}'],
      description: 'Update B-70WETH-30FEI Lens'
    },
    {
      target: 'pcvGuardian',
      values: '0',
      method: 'setSafeAddress(address)',
      arguments: ['{bbfUsdPCVDeposit}'],
      description: 'Set BB-F-USD Deposit as a safe address'
    }
  ],
  description: `
Create a "bb-f-usd" Fuse-boosted USD pool on Balancer, containing FEI, DAI, and LUSD. Boosting will use FeiRari (fuse pool 8) to generate additional yield for liquidity providers.

Use 45M$ of stablecoins from the PCV to bootstrap the new bb-f-usd pool.

After execution, the bb-f-usd pool will contain:
- 15M DAI (3M liquid, 12M boosted in FeiRari)
- 15M LUSD (3M liquid, 12M boosted in FeiRari)
- 15M FEI (3M liquid, 12M boosted in FeiRari)

This proposal will:
- Pull 25M LUSD out of the Stability Pool (B.AMM)
- Pull 5M LUSD out of FeiRari (12M are instantly re-deposited, so borrow liquidity will do +7M)
- Swap 10M LUSD for 10M DAI (max. 0.2% slippage)
- Pull 5M DAI out of FeiRari (12M are instantly re-deposited, so borrow liquidity will do +7M)
- Pull 12M FEI out of FeiRari (12M are instantly re-deposited, so borrow liquidity will stay the same)

Also fix the Lens for B-70WETH-30FEI tokens staked in Balancer gauge that currently reports an erroneous amount of protocol-owned FEI.

Forum discussion: https://tribe.fei.money/t/fip-90-fuse-boosted-usd-balancer-pool-bb-f-usd/4023
Snapshot: https://snapshot.org/#/fei.eth/proposal/0xbd8fd65f9b6cc2b44438746bf886d51ebb0f28b3be4fe58ece194d7f1d066ae4
`
};

export default fip_92;
