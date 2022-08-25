import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

const tip_121a: TemplatedProposalDescription = {
  title: 'TIP-121a: Consolidation',
  commands: [
    // 1. WETH -> DAI auction
    {
      target: 'ethToDaiLBPSwapper',
      values: '0',
      method: 'setReceivingAddress(address)',
      arguments: (addresses) => [addresses.daiHoldingPCVDeposit],
      description: 'Set the target of the WETH>DAI auction'
    },
    {
      target: 'compoundDaiPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: (addresses) => [
        addresses.ethToDaiLBPSwapper, // to
        ethers.utils.parseEther('3000000') // amount, 3M
      ],
      description: 'Move 3M DAI to the WETH>DAI swapper'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatio(address,address,uint256)',
      arguments: (addresses) => [
        addresses.wethHoldingPCVDeposit, // pcvDeposit
        addresses.ethToDaiLBPSwapper, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Move all WETH to the WETH>DAI swapper'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawWrapETH(address,address,uint256)',
      arguments: (addresses) => [
        addresses.rariPool146EthPCVDeposit, // from
        addresses.ethToDaiLBPSwapper, // to
        '71347946884944201518' // 71.34 ETH in Fuse pool 146
      ],
      description: 'Move all ETH in Fuse pool 146 to the WETH>DAI swapper'
    },
    {
      target: 'ethToDaiLBPSwapper',
      values: '0',
      method: 'swap()',
      arguments: (addresses) => [],
      description: 'Start WETH>DAI swap (over 2 days)'
    },

    // 2. LUSD -> DAI auction
    {
      target: 'compoundDaiPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: (addresses) => [
        addresses.lusdToDaiSwapper, // to
        ethers.utils.parseEther('2000000') // amount, 2M
      ],
      description: 'Move 2M DAI to the LUSD>DAI swapper'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatio(address,address,uint256)',
      arguments: (addresses) => [
        addresses.lusdHoldingPCVDeposit, // pcvDeposit
        addresses.lusdToDaiSwapper, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Move all LUSD to the LUSD>DAI swapper'
    },
    {
      target: 'lusdToDaiSwapper',
      values: '0',
      method: 'setSwapFrequency(uint256)',
      arguments: (addresses) => ['172800'],
      description: 'set swap frequency to 2 days'
    },
    {
      target: 'lusdToDaiSwapper',
      values: '0',
      method: 'forceSwap()',
      arguments: (addresses) => [],
      description: 'Start LUSD>DAI swap (over 2 days)'
    },

    // 3. Deprecate DAI compound PCVDeposit
    {
      target: 'daiFixedPricePSM',
      values: '0',
      method: 'setSurplusTarget(address)',
      arguments: (addresses) => [addresses.daiHoldingPCVDeposit],
      description: 'Update DAI PSM to allocate surplus to daiHoldingPCVDeposit'
    },
    {
      target: 'daiPCVDripController',
      values: '0',
      method: 'setSource(address)',
      arguments: (addresses) => [addresses.daiHoldingPCVDeposit],
      description: 'Update DAI Drip controller to pull from daiHoldingPCVDeposit'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatio(address,address,uint256)',
      arguments: (addresses) => [
        addresses.compoundDaiPCVDeposit, // pcvDeposit
        addresses.daiHoldingPCVDeposit, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Move all DAI out of Compound, to the daiHoldingPCVDeposit'
    },

    // 4. Deprecate buyback contracts
    {
      target: 'noFeeFeiTribeLBPSwapper',
      values: '0',
      method: 'exitPool(address)',
      arguments: (addresses) => [addresses.daiFixedPricePSM],
      description: 'Move all FEI/TRIBE from the buyback pool to the DAI PSM'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.daiFixedPricePSM, // pcvDeposit
        addresses.tribe, // token
        addresses.core, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Move all TRIBE from DAI PSM to the DAO Treasury'
    },

    // 5. Olympus OTC
    {
      target: 'gOHMHoldingPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: (addresses) => [
        addresses.ohmEscrowUnwind, // to
        '577180000000000000000' // amount
      ],
      description: 'Fund OTC contract for unwind of Olympus treasury swap'
    },

    // 6. Guards updates
    {
      target: 'pcvSentinel',
      values: '0',
      method: 'knight(address)',
      arguments: (addresses) => [addresses.maxFeiWithdrawalGuard],
      description: 'Knight new Guard to withdraw FEI from various markets'
    },
    {
      target: 'fuseWithdrawalGuard',
      values: '0',
      method: 'setWithdrawInfo(address,(address,address,uint96))',
      arguments: (addresses) => [
        addresses.rariPool8FeiPCVDeposit,
        [addresses.daiFixedPricePSM, addresses.fei, '150000000000000000000000']
      ],
      description: 'Update Fuse Withdrawal Guard'
    },
    {
      target: 'fuseWithdrawalGuard',
      values: '0',
      method: 'setWithdrawInfo(address,(address,address,uint96))',
      arguments: (addresses) => [
        addresses.rariPool8LusdPCVDeposit,
        [addresses.lusdHoldingPCVDeposit, addresses.lusd, '3000000000000000000000']
      ],
      description: 'Update Fuse Withdrawal Guard'
    },
    {
      target: 'fuseWithdrawalGuard',
      values: '0',
      method: 'setWithdrawInfo(address,(address,address,uint96))',
      arguments: (addresses) => [addresses.rariPool79FeiPCVDeposit, [addresses.daiFixedPricePSM, addresses.fei, '0']],
      description: 'Update Fuse Withdrawal Guard'
    },

    // Finally, update CR oracle
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposits(address[])',
      arguments: (addresses) => [[addresses.lusdToDaiLensDai, addresses.lusdToDaiLensLusd]],
      description: `Update CR Oracle`
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposits(address[])',
      arguments: (addresses) => [
        [
          addresses.compoundDaiPCVDepositWrapper,
          addresses.lusdHoldingPCVDeposit,
          addresses.feiBuybackLensNoFee,
          addresses.gOHMHoldingPCVDeposit
        ]
      ],
      description: `Update CR Oracle`
    }
  ],
  description: `
  TIP-121a: Consolidation

  - Sell 22k WETH to DAI through a 2-day LBP auction on Balancer
  - Sell 18.7M LUSD to DAI through a 2-day LBP auction on Balancer
  - Move all protocol-owned DAI out of Compound
  - Finalize the deprecation of TRIBE buyback contracts
  - Move gOHM to an OTC contract where Olympus can get it back by returning TRIBE (FIP-108)
  - Withdraw as much as possible protocol FEI when liquidity available from various PCV deployments
  `
};

export default tip_121a;
