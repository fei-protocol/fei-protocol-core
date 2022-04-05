## `ICollateralizationOracleWrapper`






### `updateIfOutdated()` (external)





### `setValidityDuration(uint256 _validityDuration)` (external)





### `setReadPauseOverride(bool newReadPauseOverride)` (external)





### `setDeviationThresholdBasisPoints(uint256 _newDeviationThresholdBasisPoints)` (external)





### `setCollateralizationOracle(address _newCollateralizationOracle)` (external)





### `setCache(uint256 protocolControlledValue, uint256 userCirculatingFei, int256 protocolEquity)` (external)





### `cachedProtocolControlledValue() → uint256` (external)





### `cachedUserCirculatingFei() → uint256` (external)





### `cachedProtocolEquity() → int256` (external)





### `deviationThresholdBasisPoints() → uint256` (external)





### `collateralizationOracle() → address` (external)





### `isOutdatedOrExceededDeviationThreshold() → bool` (external)





### `pcvStatsCurrent() → uint256 protocolControlledValue, uint256 userCirculatingFei, int256 protocolEquity, bool validityStatus` (external)





### `isExceededDeviationThreshold() → bool` (external)





### `readPauseOverride() → bool` (external)






### `CachedValueUpdate(address from, uint256 protocolControlledValue, uint256 userCirculatingFei, int256 protocolEquity)`





### `CollateralizationOracleUpdate(address from, address oldOracleAddress, address newOracleAddress)`





### `DeviationThresholdUpdate(address from, uint256 oldThreshold, uint256 newThreshold)`





### `ReadPauseOverrideUpdate(bool readPauseOverride)`







