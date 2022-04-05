## `TribeReserveStabilizer`






### `constructor(address _core, address _tribeOracle, address _backupOracle, uint256 _usdPerFeiBasisPoints, contract ICollateralizationOracle _collateralizationOracle, uint256 _collateralizationThresholdBasisPoints, contract ITribeMinter _tribeMinter, uint256 _osmDuration)` (public)

Tribe Reserve Stabilizer constructor




### `exchangeFei(uint256 feiAmount) → uint256` (public)

exchange FEI for minted TRIBE


the timer counts down from first time below threshold and opens after window

### `withdraw(address, uint256)` (external)



reverts. Held TRIBE should only be released by exchangeFei or mint

### `isCollateralizationBelowThreshold() → bool` (public)

check whether collateralization ratio is below the threshold set


returns false if the oracle is invalid

### `startOracleDelayCountdown()` (external)

delay the opening of the TribeReserveStabilizer until oracle delay duration is met



### `resetOracleDelayCountdown()` (external)

reset the opening of the TribeReserveStabilizer oracle delay as soon as above CR target



### `setCollateralizationOracle(contract ICollateralizationOracle newCollateralizationOracle)` (external)

set the Collateralization oracle



### `setCollateralizationThreshold(uint256 newCollateralizationThresholdBasisPoints)` (external)

set the collateralization threshold below which exchanging becomes active



### `collateralizationThreshold() → struct Decimal.D256` (external)

the collateralization threshold below which exchanging becomes active



### `_transfer(address to, uint256 amount)` (internal)





### `_pauseTimer()` (internal)








