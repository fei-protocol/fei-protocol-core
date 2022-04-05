## `IRiskCurve`






### `changeWeights()` (external)

kick off a new weight change using the current leverage and weight change time



### `changeCurve(struct IRiskCurve.CurveParams curveParams)` (external)

change the risk curve parameters



### `isWeightChangeEligible() → bool` (external)

determine whether or not to kick off a new weight change



### `getCurveParams() → struct IRiskCurve.CurveParams` (external)

return the risk curve parameters



### `getCurrentLeverage() → uint256` (external)

return the current leverage in the protocol, defined as PCV / protocol equity



### `getAssetWeight(address asset, uint256 leverage) → uint256` (external)

return the balancer weight of an asset at a given leverage



### `getWeights(uint256 leverage) → address[], uint256[]` (external)

return the set of assets and their corresponding weights at a given leverage



### `getCurrentTargetAssetWeight(address asset) → uint256` (external)

return the target weight for an asset at current leverage



### `getCurrentTargetWeights() → address[], uint256[]` (external)

return the set of assets and their corresponding weights at a current leverage



### `getWeightChangeTime(uint256[] oldWeights, uint256[] newWeights) → uint256` (external)

get the number of seconds to transition weights given the old and new weights





### `CurveParams`


address[] assets


uint256[] baseWeights


int256[] slopes



