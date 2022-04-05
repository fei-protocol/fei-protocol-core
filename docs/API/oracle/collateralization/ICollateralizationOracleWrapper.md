## <span id="ICollateralizationOracleWrapper"></span> `ICollateralizationOracleWrapper`



- [`updateIfOutdated()`][ICollateralizationOracleWrapper-updateIfOutdated--]
- [`setValidityDuration(uint256 _validityDuration)`][ICollateralizationOracleWrapper-setValidityDuration-uint256-]
- [`setReadPauseOverride(bool newReadPauseOverride)`][ICollateralizationOracleWrapper-setReadPauseOverride-bool-]
- [`setDeviationThresholdBasisPoints(uint256 _newDeviationThresholdBasisPoints)`][ICollateralizationOracleWrapper-setDeviationThresholdBasisPoints-uint256-]
- [`setCollateralizationOracle(address _newCollateralizationOracle)`][ICollateralizationOracleWrapper-setCollateralizationOracle-address-]
- [`setCache(uint256 protocolControlledValue, uint256 userCirculatingFei, int256 protocolEquity)`][ICollateralizationOracleWrapper-setCache-uint256-uint256-int256-]
- [`cachedProtocolControlledValue()`][ICollateralizationOracleWrapper-cachedProtocolControlledValue--]
- [`cachedUserCirculatingFei()`][ICollateralizationOracleWrapper-cachedUserCirculatingFei--]
- [`cachedProtocolEquity()`][ICollateralizationOracleWrapper-cachedProtocolEquity--]
- [`deviationThresholdBasisPoints()`][ICollateralizationOracleWrapper-deviationThresholdBasisPoints--]
- [`collateralizationOracle()`][ICollateralizationOracleWrapper-collateralizationOracle--]
- [`isOutdatedOrExceededDeviationThreshold()`][ICollateralizationOracleWrapper-isOutdatedOrExceededDeviationThreshold--]
- [`pcvStatsCurrent()`][ICollateralizationOracleWrapper-pcvStatsCurrent--]
- [`isExceededDeviationThreshold()`][ICollateralizationOracleWrapper-isExceededDeviationThreshold--]
- [`readPauseOverride()`][ICollateralizationOracleWrapper-readPauseOverride--]
- [`pcvStats()`][ICollateralizationOracle-pcvStats--]
- [`isOvercollateralized()`][ICollateralizationOracle-isOvercollateralized--]
- [`update()`][IOracle-update--]
- [`read()`][IOracle-read--]
- [`isOutdated()`][IOracle-isOutdated--]
- [`CachedValueUpdate(address from, uint256 protocolControlledValue, uint256 userCirculatingFei, int256 protocolEquity)`][ICollateralizationOracleWrapper-CachedValueUpdate-address-uint256-uint256-int256-]
- [`CollateralizationOracleUpdate(address from, address oldOracleAddress, address newOracleAddress)`][ICollateralizationOracleWrapper-CollateralizationOracleUpdate-address-address-address-]
- [`DeviationThresholdUpdate(address from, uint256 oldThreshold, uint256 newThreshold)`][ICollateralizationOracleWrapper-DeviationThresholdUpdate-address-uint256-uint256-]
- [`ReadPauseOverrideUpdate(bool readPauseOverride)`][ICollateralizationOracleWrapper-ReadPauseOverrideUpdate-bool-]
- [`Update(uint256 _peg)`][IOracle-Update-uint256-]
### <span id="ICollateralizationOracleWrapper-updateIfOutdated--"></span> `updateIfOutdated()` (external)



### <span id="ICollateralizationOracleWrapper-setValidityDuration-uint256-"></span> `setValidityDuration(uint256 _validityDuration)` (external)



### <span id="ICollateralizationOracleWrapper-setReadPauseOverride-bool-"></span> `setReadPauseOverride(bool newReadPauseOverride)` (external)



### <span id="ICollateralizationOracleWrapper-setDeviationThresholdBasisPoints-uint256-"></span> `setDeviationThresholdBasisPoints(uint256 _newDeviationThresholdBasisPoints)` (external)



### <span id="ICollateralizationOracleWrapper-setCollateralizationOracle-address-"></span> `setCollateralizationOracle(address _newCollateralizationOracle)` (external)



### <span id="ICollateralizationOracleWrapper-setCache-uint256-uint256-int256-"></span> `setCache(uint256 protocolControlledValue, uint256 userCirculatingFei, int256 protocolEquity)` (external)



### <span id="ICollateralizationOracleWrapper-cachedProtocolControlledValue--"></span> `cachedProtocolControlledValue() → uint256` (external)



### <span id="ICollateralizationOracleWrapper-cachedUserCirculatingFei--"></span> `cachedUserCirculatingFei() → uint256` (external)



### <span id="ICollateralizationOracleWrapper-cachedProtocolEquity--"></span> `cachedProtocolEquity() → int256` (external)



### <span id="ICollateralizationOracleWrapper-deviationThresholdBasisPoints--"></span> `deviationThresholdBasisPoints() → uint256` (external)



### <span id="ICollateralizationOracleWrapper-collateralizationOracle--"></span> `collateralizationOracle() → address` (external)



### <span id="ICollateralizationOracleWrapper-isOutdatedOrExceededDeviationThreshold--"></span> `isOutdatedOrExceededDeviationThreshold() → bool` (external)



### <span id="ICollateralizationOracleWrapper-pcvStatsCurrent--"></span> `pcvStatsCurrent() → uint256 protocolControlledValue, uint256 userCirculatingFei, int256 protocolEquity, bool validityStatus` (external)



### <span id="ICollateralizationOracleWrapper-isExceededDeviationThreshold--"></span> `isExceededDeviationThreshold() → bool` (external)



### <span id="ICollateralizationOracleWrapper-readPauseOverride--"></span> `readPauseOverride() → bool` (external)



### <span id="ICollateralizationOracleWrapper-CachedValueUpdate-address-uint256-uint256-int256-"></span> `CachedValueUpdate(address from, uint256 protocolControlledValue, uint256 userCirculatingFei, int256 protocolEquity)`



### <span id="ICollateralizationOracleWrapper-CollateralizationOracleUpdate-address-address-address-"></span> `CollateralizationOracleUpdate(address from, address oldOracleAddress, address newOracleAddress)`



### <span id="ICollateralizationOracleWrapper-DeviationThresholdUpdate-address-uint256-uint256-"></span> `DeviationThresholdUpdate(address from, uint256 oldThreshold, uint256 newThreshold)`



### <span id="ICollateralizationOracleWrapper-ReadPauseOverrideUpdate-bool-"></span> `ReadPauseOverrideUpdate(bool readPauseOverride)`



