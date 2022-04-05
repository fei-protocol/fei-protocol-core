## `CollateralizationOracleGuardian`






### `constructor(address _core, contract ICollateralizationOracleWrapper _oracleWrapper, uint256 _frequency, uint256 _deviationThresholdBasisPoints)` (public)

The constructor for CollateralizationOracleGuardian
        @param _core the core address to reference
        @param _oracleWrapper the instance of CollateralizationOracleWrapper
        @param _frequency the maximum frequency a guardian can update the cache
        @param _deviationThresholdBasisPoints the maximum percent change in a cache value for a given update



### `setCache(uint256 protocolControlledValue, uint256 userCirculatingFei)` (external)

guardian set the cache values on collateralization oracle


make sure to pause the CR oracle wrapper or else the set value would be overwritten on next update

### `calculateDeviationThresholdBasisPoints(uint256 a, uint256 b) → uint256` (public)

return the percent deviation between a and b in basis points terms



### `setDeviationThresholdBasisPoints(uint256 newDeviationThresholdBasisPoints)` (external)

governance setter for maximum deviation the guardian can change per update



### `_setDeviationThresholdBasisPoints(uint256 newDeviationThresholdBasisPoints)` (internal)






### `DeviationThresholdUpdate(uint256 oldDeviationThresholdBasisPoints, uint256 newDeviationThresholdBasisPoints)`







