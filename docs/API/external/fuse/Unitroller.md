## <span id="Unitroller"></span> `Unitroller`



- [`enterMarkets(address[] cTokens)`][Unitroller-enterMarkets-address---]
- [`_setPendingAdmin(address newPendingAdmin)`][Unitroller-_setPendingAdmin-address-]
- [`_setBorrowCapGuardian(address newBorrowCapGuardian)`][Unitroller-_setBorrowCapGuardian-address-]
- [`_setMarketSupplyCaps(contract CToken[] cTokens, uint256[] newSupplyCaps)`][Unitroller-_setMarketSupplyCaps-contract-CToken---uint256---]
- [`_setMarketBorrowCaps(contract CToken[] cTokens, uint256[] newBorrowCaps)`][Unitroller-_setMarketBorrowCaps-contract-CToken---uint256---]
- [`_setPauseGuardian(address newPauseGuardian)`][Unitroller-_setPauseGuardian-address-]
- [`_setMintPaused(contract CToken cToken, bool state)`][Unitroller-_setMintPaused-contract-CToken-bool-]
- [`_setBorrowPaused(contract CToken cToken, bool borrowPaused)`][Unitroller-_setBorrowPaused-contract-CToken-bool-]
- [`_setTransferPaused(bool state)`][Unitroller-_setTransferPaused-bool-]
- [`_setSeizePaused(bool state)`][Unitroller-_setSeizePaused-bool-]
- [`_setPriceOracle(address newOracle)`][Unitroller-_setPriceOracle-address-]
- [`_setCloseFactor(uint256 newCloseFactorMantissa)`][Unitroller-_setCloseFactor-uint256-]
- [`_setLiquidationIncentive(uint256 newLiquidationIncentiveMantissa)`][Unitroller-_setLiquidationIncentive-uint256-]
- [`_setCollateralFactor(contract CToken cToken, uint256 newCollateralFactorMantissa)`][Unitroller-_setCollateralFactor-contract-CToken-uint256-]
- [`_acceptAdmin()`][Unitroller-_acceptAdmin--]
- [`_deployMarket(bool isCEther, bytes constructionData, uint256 collateralFactorMantissa)`][Unitroller-_deployMarket-bool-bytes-uint256-]
- [`borrowGuardianPaused(address cToken)`][Unitroller-borrowGuardianPaused-address-]
- [`comptrollerImplementation()`][Unitroller-comptrollerImplementation--]
- [`rewardsDistributors(uint256 index)`][Unitroller-rewardsDistributors-uint256-]
- [`_addRewardsDistributor(address distributor)`][Unitroller-_addRewardsDistributor-address-]
- [`_setWhitelistEnforcement(bool enforce)`][Unitroller-_setWhitelistEnforcement-bool-]
- [`_setWhitelistStatuses(address[] suppliers, bool[] statuses)`][Unitroller-_setWhitelistStatuses-address---bool---]
- [`_unsupportMarket(contract CToken cToken)`][Unitroller-_unsupportMarket-contract-CToken-]
- [`_toggleAutoImplementations(bool enabled)`][Unitroller-_toggleAutoImplementations-bool-]
### <span id="Unitroller-enterMarkets-address---"></span> `enterMarkets(address[] cTokens) → uint256[]` (public)



### <span id="Unitroller-_setPendingAdmin-address-"></span> `_setPendingAdmin(address newPendingAdmin) → uint256` (public)



### <span id="Unitroller-_setBorrowCapGuardian-address-"></span> `_setBorrowCapGuardian(address newBorrowCapGuardian)` (public)



### <span id="Unitroller-_setMarketSupplyCaps-contract-CToken---uint256---"></span> `_setMarketSupplyCaps(contract CToken[] cTokens, uint256[] newSupplyCaps)` (external)



### <span id="Unitroller-_setMarketBorrowCaps-contract-CToken---uint256---"></span> `_setMarketBorrowCaps(contract CToken[] cTokens, uint256[] newBorrowCaps)` (external)



### <span id="Unitroller-_setPauseGuardian-address-"></span> `_setPauseGuardian(address newPauseGuardian) → uint256` (public)



### <span id="Unitroller-_setMintPaused-contract-CToken-bool-"></span> `_setMintPaused(contract CToken cToken, bool state) → bool` (public)



### <span id="Unitroller-_setBorrowPaused-contract-CToken-bool-"></span> `_setBorrowPaused(contract CToken cToken, bool borrowPaused) → bool` (public)



### <span id="Unitroller-_setTransferPaused-bool-"></span> `_setTransferPaused(bool state) → bool` (public)



### <span id="Unitroller-_setSeizePaused-bool-"></span> `_setSeizePaused(bool state) → bool` (public)



### <span id="Unitroller-_setPriceOracle-address-"></span> `_setPriceOracle(address newOracle) → uint256` (external)



### <span id="Unitroller-_setCloseFactor-uint256-"></span> `_setCloseFactor(uint256 newCloseFactorMantissa) → uint256` (external)



### <span id="Unitroller-_setLiquidationIncentive-uint256-"></span> `_setLiquidationIncentive(uint256 newLiquidationIncentiveMantissa) → uint256` (external)



### <span id="Unitroller-_setCollateralFactor-contract-CToken-uint256-"></span> `_setCollateralFactor(contract CToken cToken, uint256 newCollateralFactorMantissa) → uint256` (public)



### <span id="Unitroller-_acceptAdmin--"></span> `_acceptAdmin() → uint256` (external)



### <span id="Unitroller-_deployMarket-bool-bytes-uint256-"></span> `_deployMarket(bool isCEther, bytes constructionData, uint256 collateralFactorMantissa) → uint256` (external)



### <span id="Unitroller-borrowGuardianPaused-address-"></span> `borrowGuardianPaused(address cToken) → bool` (external)



### <span id="Unitroller-comptrollerImplementation--"></span> `comptrollerImplementation() → address` (external)



### <span id="Unitroller-rewardsDistributors-uint256-"></span> `rewardsDistributors(uint256 index) → address` (external)



### <span id="Unitroller-_addRewardsDistributor-address-"></span> `_addRewardsDistributor(address distributor) → uint256` (external)



### <span id="Unitroller-_setWhitelistEnforcement-bool-"></span> `_setWhitelistEnforcement(bool enforce) → uint256` (external)



### <span id="Unitroller-_setWhitelistStatuses-address---bool---"></span> `_setWhitelistStatuses(address[] suppliers, bool[] statuses) → uint256` (external)



### <span id="Unitroller-_unsupportMarket-contract-CToken-"></span> `_unsupportMarket(contract CToken cToken) → uint256` (external)



### <span id="Unitroller-_toggleAutoImplementations-bool-"></span> `_toggleAutoImplementations(bool enabled) → uint256` (public)



