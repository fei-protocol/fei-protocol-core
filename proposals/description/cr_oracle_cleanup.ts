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
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('ORACLE_ADMIN_ROLE'), addresses.collateralizationOracleGuardian],
      description:
        'Revoke ORACLE_ADMIN_ROLE from collateralizationOracleGuardian (no more guardian updates of cached CR Oracle)'
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
    /*{
      target: 'raiPriceBoundPSM',
      values: '0',
      method: 'unpause()',
      arguments: (addresses) => [],
      description: 'Unpause RAI PSM'
    },*/
    /*{
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatio(address,address,uint256)',
      arguments: (addresses) => [addresses.ethTokemakPCVDeposit, addresses.ethPSM, '10000'],
      description: 'Withdraw all ETH from Tokemak'
    },*/
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
          addresses.d3poolCurvePCVDeposit, // 1034$ left in Curve d3
          addresses.uniswapPCVDeposit, // 0$ left in FEI/ETH Uniswap v2
          addresses.compoundEthPCVDepositWrapper, // 0 ETH left in Compound
          addresses.raiPriceBoundPSM, // Assuming RAI PSM has been unpaused & emptied
          addresses.ethTokemakPCVDeposit // Assuming this has been emptied
        ]
      ],
      description: 'Remove deprecated/empty deposits from CR oracle'
    }
  ],
  description: `CR Oracle cleanup

Deprecate old CR oracle caching features :
 - collateralizationOracle is now read directly by pcvEquityMinter (buybacks) and tribeReserveStabilizer (backstop)
 - collateralizationOracleWrapper and collateralizationOracleWrapperImpl are no longer used anywhere in the system
 - collateralizationOracleGuardian (used to update the cache) is no longer used (revoked ORACLE_ADMIN_ROLE role)
 - collateralizationOracleKeeper (used to incentivize updates of the cache) is no longer used (revoked MINTER_ROLE role)

Remove empty or deprecated PCV Deposits from CR oracle :
 - DPI->DAI LBP lenses
 - B.AMM LUSD Deposit (deprecated, would need to redeploy to use the new B.AMM)
 - Fuse pool 7 (Tetranode) LUSD deposit (0$ left)
 - Fuse pool 6, 19, and 24 FEI deposit (114$, 0$, and 6k$ left)
 - DAO Timelock lenses for agEUR and WETH
 - Curve/Convex d3 deposits (1034$ left in Curve)
 - ETH in Tokemak (0$ left)
 - Withdraw remaining ETH/FEI liquidity from Uniswap v2
`
};

export default proposal;
