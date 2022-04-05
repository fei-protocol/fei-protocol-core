## `ConstantOracle`

Return a constant oracle price




### `constructor(address _core, uint256 _priceBasisPoints)` (public)

Constant oracle constructor




### `update()` (external)

updates the oracle price


no-op, oracle is fixed

### `isOutdated() → bool` (external)

determine if read value is stale


always false, oracle is fixed

### `read() → struct Decimal.D256, bool` (external)

read the oracle price







