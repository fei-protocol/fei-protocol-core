## `OracleRef`

defines some utilities around interacting with the referenced oracle




### `constructor(address _core, address _oracle, address _backupOracle, int256 _decimalsNormalizer, bool _doInvert)` (internal)

OracleRef constructor




### `setOracle(address newOracle)` (external)

sets the referenced oracle




### `setDoInvert(bool newDoInvert)` (external)

sets the flag for whether to invert or not




### `setDecimalsNormalizer(int256 newDecimalsNormalizer)` (external)

sets the new decimalsNormalizer




### `setBackupOracle(address newBackupOracle)` (external)

sets the referenced backup oracle




### `invert(struct Decimal.D256 price) → struct Decimal.D256` (public)

invert a peg price


the inverted peg would be X per FEI

### `updateOracle()` (public)

updates the referenced oracle



### `readOracle() → struct Decimal.D256` (public)

the peg price of the referenced oracle


the peg is defined as FEI per X with X being ETH, dollars, etc

### `_setOracle(address newOracle)` (internal)





### `_setBackupOracle(address newBackupOracle)` (internal)





### `_setDoInvert(bool newDoInvert)` (internal)





### `_setDecimalsNormalizer(int256 newDecimalsNormalizer)` (internal)





### `_setDecimalsNormalizerFromToken(address token)` (internal)








