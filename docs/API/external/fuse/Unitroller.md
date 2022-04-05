## `Unitroller`






### `enterMarkets(address[] cTokens) → uint256[]` (public)





### `_setPendingAdmin(address newPendingAdmin) → uint256` (public)





### `_setBorrowCapGuardian(address newBorrowCapGuardian)` (public)





### `_setMarketSupplyCaps(contract CToken[] cTokens, uint256[] newSupplyCaps)` (external)





### `_setMarketBorrowCaps(contract CToken[] cTokens, uint256[] newBorrowCaps)` (external)





### `_setPauseGuardian(address newPauseGuardian) → uint256` (public)





### `_setMintPaused(contract CToken cToken, bool state) → bool` (public)





### `_setBorrowPaused(contract CToken cToken, bool borrowPaused) → bool` (public)





### `_setTransferPaused(bool state) → bool` (public)





### `_setSeizePaused(bool state) → bool` (public)





### `_setPriceOracle(address newOracle) → uint256` (external)





### `_setCloseFactor(uint256 newCloseFactorMantissa) → uint256` (external)





### `_setLiquidationIncentive(uint256 newLiquidationIncentiveMantissa) → uint256` (external)





### `_setCollateralFactor(contract CToken cToken, uint256 newCollateralFactorMantissa) → uint256` (public)





### `_acceptAdmin() → uint256` (external)





### `_deployMarket(bool isCEther, bytes constructionData, uint256 collateralFactorMantissa) → uint256` (external)





### `borrowGuardianPaused(address cToken) → bool` (external)





### `comptrollerImplementation() → address` (external)





### `rewardsDistributors(uint256 index) → address` (external)





### `_addRewardsDistributor(address distributor) → uint256` (external)





### `_setWhitelistEnforcement(bool enforce) → uint256` (external)





### `_setWhitelistStatuses(address[] suppliers, bool[] statuses) → uint256` (external)





### `_unsupportMarket(contract CToken cToken) → uint256` (external)





### `_toggleAutoImplementations(bool enabled) → uint256` (public)







### `Market`


bool isListed


uint256 collateralFactorMantissa


mapping(address => bool) accountMembership



