## `ChainlinkOracleWrapper`

Reads a Chainlink oracle value & wrap it under the standard Fei oracle interface




### `constructor(address _core, address _chainlinkOracle)` (public)

ChainlinkOracleWrapper constructor




### `_init()` (internal)





### `update()` (external)

updates the oracle price


no-op, Chainlink is updated automatically

### `isOutdated() → bool` (external)

determine if read value is stale




### `read() → struct Decimal.D256, bool` (external)

read the oracle price







