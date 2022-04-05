## `CompositeOracle`

Reads two oracles and returns their product




### `constructor(address _core, contract IOracle _oracleA, contract IOracle _oracleB)` (public)

CompositeOracle constructor




### `update()` (external)

updates the oracle price



### `isOutdated() → bool` (external)

determine if read value is stale




### `read() → struct Decimal.D256, bool` (external)

read the oracle price







