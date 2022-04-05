## `PriceBoundPSM`

contract to create a price bound DAI PSM
This contract will allow swaps when the price of DAI is between 98 cents and 1.02 by default
These defaults are changeable by the admin and governance by calling floor and ceiling setters
setOracleFloor and setOracleCeiling




### `constructor(uint256 _floor, uint256 _ceiling, struct PegStabilityModule.OracleParams _params, uint256 _mintFeeBasisPoints, uint256 _redeemFeeBasisPoints, uint256 _reservesThreshold, uint256 _feiLimitPerSecond, uint256 _mintingBufferCap, contract IERC20 _underlyingToken, contract IPCVDeposit _surplusTarget)` (public)

constructor




### `setOracleFloorBasisPoints(uint256 newFloorBasisPoints)` (external)

sets the floor price in BP



### `setOracleCeilingBasisPoints(uint256 newCeilingBasisPoints)` (external)

sets the ceiling price in BP



### `isPriceValid() → bool` (external)





### `_setCeilingBasisPoints(uint256 newCeilingBasisPoints)` (internal)

helper function to set the ceiling in basis points



### `_setFloorBasisPoints(uint256 newFloorBasisPoints)` (internal)

helper function to set the floor in basis points



### `_validPrice(struct Decimal.D256 price) → bool valid` (internal)

helper function to determine if price is within a valid range



### `_validatePriceRange(struct Decimal.D256 price)` (internal)

reverts if the price is greater than or equal to the ceiling or less than or equal to the floor






