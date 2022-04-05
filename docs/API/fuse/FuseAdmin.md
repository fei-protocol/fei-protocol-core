## `FuseAdmin`






### `constructor(address _core, contract Unitroller _comptroller)` (public)





### `oracleAdd(address[] underlyings, address[] _oracles)` (external)





### `oracleChangeAdmin(address newAdmin)` (external)





### `_addRewardsDistributor(address distributor)` (external)





### `_setWhitelistEnforcement(bool enforce)` (external)





### `_setWhitelistStatuses(address[] suppliers, bool[] statuses)` (external)





### `_setPriceOracle(address newOracle)` (public)





### `_setCloseFactor(uint256 newCloseFactorMantissa)` (external)





### `_setCollateralFactor(contract CToken cToken, uint256 newCollateralFactorMantissa)` (public)





### `_setLiquidationIncentive(uint256 newLiquidationIncentiveMantissa)` (external)





### `_deployMarket(address underlying, address irm, string name, string symbol, address impl, bytes data, uint256 reserveFactor, uint256 adminFee, uint256 collateralFactorMantissa)` (external)





### `_unsupportMarket(contract CToken cToken)` (external)





### `_toggleAutoImplementations(bool enabled)` (public)





### `_setPendingAdmin(address newPendingAdmin)` (public)





### `_acceptAdmin()` (public)








