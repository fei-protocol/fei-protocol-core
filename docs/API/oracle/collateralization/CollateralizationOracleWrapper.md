## `CollateralizationOracleWrapper`

Reads a list of PCVDeposit that report their amount of collateral
        and the amount of protocol-owned FEI they manage, to deduce the
        protocol-wide collateralization ratio.




### `constructor(address _core, uint256 _validityDuration)` (public)

CollateralizationOracleWrapper constructor




### `initialize(address _core, address _collateralizationOracle, uint256 _validityDuration, uint256 _deviationThresholdBasisPoints)` (public)

CollateralizationOracleWrapper initializer




### `setCollateralizationOracle(address _newCollateralizationOracle)` (external)

set the address of the CollateralizationOracle to inspect, and
to cache values from.




### `setDeviationThresholdBasisPoints(uint256 _newDeviationThresholdBasisPoints)` (external)

set the deviation threshold in basis points, used to detect if the
cached value deviated significantly from the actual fresh readings.




### `setValidityDuration(uint256 _validityDuration)` (external)

set the validity duration of the cached collateralization values.




### `setReadPauseOverride(bool _readPauseOverride)` (external)

set the readPauseOverride flag




### `setCache(uint256 _cachedProtocolControlledValue, uint256 _cachedUserCirculatingFei, int256 _cachedProtocolEquity)` (external)

governor or admin override to directly write to the cache


used in emergencies where the underlying oracle is compromised or failing

### `update()` (external)

update reading of the CollateralizationOracle



### `updateIfOutdated()` (external)

this method reverts if the oracle is not outdated
        It is useful if the caller is incentivized for calling only when the deviation threshold or frequency has passed



### `_update() → bool` (internal)





### `_setCache(uint256 _cachedProtocolControlledValue, uint256 _cachedUserCirculatingFei, int256 _cachedProtocolEquity)` (internal)





### `isOutdated() → bool outdated` (public)





### `read() → struct Decimal.D256 collateralRatio, bool validityStatus` (external)

Get the current collateralization ratio of the protocol, from cache.




### `isExceededDeviationThreshold() → bool obsolete` (public)





### `_isExceededDeviationThreshold(uint256 cached, uint256 current) → bool` (internal)





### `isOutdatedOrExceededDeviationThreshold() → bool` (external)





### `pcvStats() → uint256 protocolControlledValue, uint256 userCirculatingFei, int256 protocolEquity, bool validityStatus` (external)

returns the Protocol-Controlled Value, User-circulating FEI, and
        Protocol Equity. If there is a fresh cached value, return it.
        Otherwise, call the CollateralizationOracle to get fresh data.




### `isOvercollateralized() → bool` (external)

returns true if the protocol is overcollateralized. Overcollateralization
        is defined as the protocol having more assets in its PCV (Protocol
        Controlled Value) than the circulating (user-owned) FEI, i.e.
        a positive Protocol Equity.



### `pcvStatsCurrent() → uint256 protocolControlledValue, uint256 userCirculatingFei, int256 protocolEquity, bool validityStatus` (external)

returns the Protocol-Controlled Value, User-circulating FEI, and
        Protocol Equity, from an actual fresh call to the CollateralizationOracle.




### `_readNotPaused() → bool` (internal)








