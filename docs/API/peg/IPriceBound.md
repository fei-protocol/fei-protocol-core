## `IPriceBound`






### `setOracleFloorBasisPoints(uint256 newFloor)` (external)

sets the floor price in BP



### `setOracleCeilingBasisPoints(uint256 newCeiling)` (external)

sets the ceiling price in BP



### `floor() → uint256` (external)

get the floor price in basis points



### `ceiling() → uint256` (external)

get the ceiling price in basis points



### `isPriceValid() → bool` (external)

return wether the current oracle price is valid or not




### `OracleFloorUpdate(uint256 oldFloor, uint256 newFloor)`

event emitted when minimum floor price is updated



### `OracleCeilingUpdate(uint256 oldCeiling, uint256 newCeiling)`

event emitted when maximum ceiling price is updated





