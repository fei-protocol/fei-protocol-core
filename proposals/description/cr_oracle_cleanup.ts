import { ethers } from 'hardhat';
import { TemplatedProposalDescription } from '@custom-types/types';

const proposal: TemplatedProposalDescription = {
  title: 'CR Oracle cleanup',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('MINTER_ROLE'), addresses.collateralizationOracleKeeper],
      description: 'Revoke MINTER_ROLE from collateralizationOracleKeeper (no more cache updates)'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('MINTER_ROLE'), addresses.dpiUniswapPCVDeposit],
      description: 'Revoke MINTER_ROLE from dpiUniswapPCVDeposit (empty deposit)'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('MINTER_ROLE'), addresses.uniswapPCVDeposit],
      description: 'Revoke MINTER_ROLE from uniswapPCVDeposit (empty deposit)'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('MINTER_ROLE'), addresses.balancerDepositFeiWeth],
      description: 'Revoke MINTER_ROLE from balancerDepositFeiWeth (empty deposit)'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('MINTER_ROLE'), addresses.optimisticMinter],
      description: 'Revoke MINTER_ROLE from optimisticMinter (fip-96 deprecates OA timelock)'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('PCV_CONTROLLER_ROLE'), addresses.raiPCVDripController],
      description: 'Revoke PCV_CONTROLLER_ROLE from raiPCVDripController (RAI deposits are empty)'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('PCV_CONTROLLER_ROLE'), addresses.lusdPCVDripController],
      description: 'Revoke PCV_CONTROLLER_ROLE from lusdPCVDripController (BAMMDeposit is deprecated)'
    },
    {
      target: 'bammDeposit',
      values: '0',
      method: 'pause()',
      arguments: (addresses) => [],
      description: 'Prevent surplus allocation from LUSD PSM to this deprecated deposit'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('PCV_CONTROLLER_ROLE'), addresses.aaveEthPCVDripController],
      description: 'Revoke PCV_CONTROLLER_ROLE from aaveEthPCVDripController (Aave deposit is deprecated)'
    },
    {
      target: 'aaveEthPCVDeposit',
      values: '0',
      method: 'pause()',
      arguments: (addresses) => [],
      description: 'Prevent surplus allocation from ETH PSM to this deprecated deposit'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('ORACLE_ADMIN_ROLE'), addresses.collateralizationOracleGuardian],
      description:
        'Revoke ORACLE_ADMIN_ROLE from collateralizationOracleGuardian (no more guardian updates of cached CR Oracle)'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('ORACLE_ADMIN_ROLE'), addresses.optimisticTimelock],
      description: 'Revoke ORACLE_ADMIN_ROLE from optimisticTimelock (OA is deprecated)'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('SWAP_ADMIN_ROLE'), addresses.optimisticTimelock],
      description: 'Revoke SWAP_ADMIN_ROLE from optimisticTimelock (OA is deprecated)'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('FUSE_ADMIN'), addresses.optimisticTimelock],
      description: 'Revoke FUSE_ADMIN from optimisticTimelock (OA is deprecated)'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('PCV_GUARDIAN_ADMIN_ROLE'), addresses.optimisticTimelock],
      description: 'Revoke PCV_GUARDIAN_ADMIN_ROLE from optimisticTimelock (OA is deprecated)'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('METAGOVERNANCE_GAUGE_ADMIN'), addresses.optimisticTimelock],
      description: 'Revoke METAGOVERNANCE_GAUGE_ADMIN from optimisticTimelock (OA is deprecated)'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('PCV_MINOR_PARAM_ROLE'), addresses.optimisticTimelock],
      description: 'Revoke PCV_MINOR_PARAM_ROLE from optimisticTimelock (OA is deprecated)'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('TOKEMAK_DEPOSIT_ADMIN_ROLE'), addresses.optimisticTimelock],
      description: 'Revoke TOKEMAK_DEPOSIT_ADMIN_ROLE from optimisticTimelock (OA is deprecated)'
    },
    {
      target: 'tribeReserveStabilizer',
      values: '0',
      method: 'setCollateralizationOracle(address)',
      arguments: (addresses) => [addresses.collateralizationOracle],
      description: 'Set CR Oracle in Tribe Reserve Stabilizer (backstop) to the uncached CR Oracle'
    },
    {
      target: 'pcvEquityMinter',
      values: '0',
      method: 'setCollateralizationOracle(address)',
      arguments: (addresses) => [addresses.collateralizationOracle],
      description: 'Set CR Oracle in PCV Equity Minter (buybacks) to the uncached CR Oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'setOracle(address,address)',
      arguments: (addresses) => [addresses.volt, addresses.voltOracle],
      description: 'Replace VOLT oracle in CR oracle'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatio(address,address,uint256)',
      arguments: (addresses) => [addresses.uniswapPCVDeposit, addresses.ethPSM, '10000'],
      description: 'Withdraw remaining ETH/FEI liquidity from Uniswap v2'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'setOracle(address,address)',
      arguments: (addresses) => [addresses.uniswapPCVDeposit, addresses.voltOracle],
      description: 'Replace VOLT oracle in CR oracle'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioWrapETH(address,address,uint256)',
      arguments: (addresses) => [addresses.ethTokemakPCVDeposit, addresses.ethPSM, '10000'],
      description: 'Withdraw all ETH from Tokemak to ETH PSM'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [addresses.ethTokemakPCVDeposit, addresses.toke, addresses.tribalCouncilSafe, '10000'],
      description: 'Withdraw all TOKE from Tokemak ETH deposit to TC Multisig where it can be sold'
    },
    {
      target: 'd3poolCurvePCVDeposit',
      values: '0',
      method: 'exitPool()',
      arguments: (addresses) => [],
      description: 'Exit d3pool position'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [addresses.d3poolCurvePCVDeposit, addresses.fei, addresses.daiFixedPricePSM, '10000'],
      description: 'Withdraw all FEI on d3 deposit to DAI PSM where it can be burnt'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [addresses.d3poolCurvePCVDeposit, addresses.frax, addresses.tribalCouncilSafe, '10000'],
      description: 'Withdraw all FRAX on d3 deposit to TC Multisig where it can be sold'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.d3poolCurvePCVDeposit,
        addresses.alusd,
        addresses.tribalCouncilSafe,
        '10000'
      ],
      description: 'Withdraw all alUSD on d3 deposit to TC Multisig where it can be sold'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [addresses.compoundEthPCVDeposit, addresses.comp, addresses.tribalCouncilSafe, '10000'],
      description: 'Withdraw all COMP from Compound ETH deposit to TC Multisig where it can be sold'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [addresses.compoundDaiPCVDeposit, addresses.comp, addresses.tribalCouncilSafe, '10000'],
      description: 'Withdraw all COMP from Compound DAI deposit to TC Multisig where it can be sold'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [addresses.aaveEthPCVDeposit, addresses.stAAVE, addresses.tribalCouncilSafe, '10000'],
      description: 'Withdraw all stkAAVE from Aave ETH deposit to TC Multisig where it can be sold'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [addresses.d3poolConvexPCVDeposit, addresses.crv, addresses.tribalCouncilSafe, '10000'],
      description: 'Withdraw all CRV from Convex deposit to TC Multisig where it can be sold'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [addresses.d3poolConvexPCVDeposit, addresses.cvx, addresses.tribalCouncilSafe, '10000'],
      description: 'Withdraw all CVX from Convex deposit to TC Multisig where it can be sold'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [addresses.bammDeposit, addresses.lqty, addresses.tribalCouncilTimelock, '10000'],
      description: 'Withdraw all LQTY from B.AMM deposit to TC Timelock'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [addresses.raiPriceBoundPSM, addresses.rai, addresses.tribalCouncilSafe, '10000'],
      description: 'Withdraw all RAI from PSM to TC Multisig where it can be sold'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [addresses.raiPriceBoundPSM, addresses.fei, addresses.daiFixedPricePSM, '10000'],
      description: 'Withdraw all FEI from PSM to DAI PSM where it can be burnt'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposits(address[])',
      arguments: (addresses) => [
        [
          addresses.dpiToDaiLensDai, // 0$ left, auction ended
          addresses.dpiToDaiLensDpi, // 0$ left, auction ended
          addresses.bammDeposit, // 0$ left, deprecated (need redeploy)
          addresses.rariPool7LusdPCVDeposit, // 0$ left
          addresses.rariPool6FeiPCVDepositWrapper, // 114$ left
          addresses.rariPool19FeiPCVDepositWrapper, // 0$ left
          addresses.rariPool24FeiPCVDepositWrapper, // 6k$ left
          addresses.agEurDepositWrapper, // no more agEUR on the timelock
          addresses.wethDepositWrapper, // no more WETH on the timelock
          addresses.d3poolConvexPCVDeposit, // 0$ left in Convex d3
          addresses.d3poolCurvePCVDeposit, // 0$ left in Curve d3
          addresses.uniswapPCVDeposit, // 0$ left in FEI/ETH Uniswap v2
          addresses.compoundEthPCVDepositWrapper, // 0 ETH left in Compound
          addresses.aaveEthPCVDepositWrapper, // 0 ETH left in Aave
          addresses.raiPriceBoundPSM, // RAI will finish to be liquidated by TC multisig
          addresses.balancerDepositFeiWeth, // 0$ left in B-70WETH-30FEI deposit
          addresses.balancerLensBpt30Fei70Weth, // 0$ left in B-70WETH-30FEI gauge
          addresses.ethTokemakPCVDeposit // 0$ left
        ]
      ],
      description: 'Remove deprecated/empty deposits from CR oracle'
    },
    {
      target: 'pcvGuardian',
      values: '0',
      method: 'unsetSafeAddresses(address[])',
      arguments: (addresses) => [
        [
          addresses.raiPriceBoundPSM,
          addresses.aaveRaiPCVDeposit,
          addresses.rariPool9RaiPCVDeposit,
          addresses.balancerDepositFeiWeth,
          addresses.d3poolConvexPCVDeposit,
          addresses.d3poolCurvePCVDeposit,
          addresses.aaveEthPCVDeposit,
          addresses.compoundEthPCVDeposit
        ]
      ],
      description: 'Remove deprecated deposits from safe address list'
    }
  ],
  description: `CR Oracle & Optimistic Approval Cleanup

Deprecate Old CR Oracle Caching Features :
 - collateralizationOracle is now read directly by pcvEquityMinter (buybacks) and tribeReserveStabilizer (backstop)
 - collateralizationOracleWrapper and collateralizationOracleWrapperImpl are no longer used anywhere in the system
 - collateralizationOracleGuardian (used to update the cache) is no longer used (revoked ORACLE_ADMIN_ROLE role)
 - collateralizationOracleKeeper (used to incentivize updates of the cache) is no longer used (revoked MINTER_ROLE role)

Remove Empty or Deprecated PCV Deposits from CR Oracle :
 - DPI->DAI LBP lenses
 - B.AMM LUSD Deposit (deprecated, would need to redeploy to use the new B.AMM)
 - Fuse pool 7 (Tetranode) LUSD deposit (0$ left)
 - Fuse pool 6, 19, and 24 FEI deposit (114$, 0$, and 6k$ left)
 - DAO Timelock lenses for agEUR and WETH
 - Curve/Convex d3 deposits (1034$ left in Curve)
 - ETH in Tokemak (0$ left)
 - Withdraw remaining ETH/FEI liquidity from Uniswap v2 (0$ left)
 - Aave/Compound FEI/ETH deposits (0$ left)
 - Balancer FEI/WETH deposit (0$ left)


TIP-110 Simplify PCV:
 - Move LM rewards (COMP, stkAAVE, CRV, CVX) to the TC Multisig where they can be sold.
 - Move leftover RAI that is in PSM to the TC Multisig where it can be sold.
 - Move LQTY to TC Timelock where it can be moved to a proper PCVDeposit later.

Unset deprecated PCV Deposits and PSMs as safe addresses (eligible destinations for PCV Guardian).

Deprecate OA Roles:
 - ORACLE_ADMIN ROLE
 - SWAP_ADMIN_ROLE
 - FUSE_ADMIN
 - PCV_GUARDIAN_ADMIN_ROLE
 - METAGOVERNANCE_GAUGE_ADMIN
 - PCV_MINOR_PARAM_ROLE
 - TOKEMAK_DEPOSIT_ADMIN_ROLE
`
};

export default proposal;
