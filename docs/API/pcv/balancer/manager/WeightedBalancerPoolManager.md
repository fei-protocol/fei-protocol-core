## `WeightedBalancerPoolManager`

an abstract utility class for a contract that manages a Balancer WeightedPool (including LBP)
exposes the governable methods to Fei Governors or admins




### `constructor()` (internal)





### `setSwapEnabled(contract IWeightedPool pool, bool swapEnabled)` (public)





### `updateWeightsGradually(contract IWeightedPool pool, uint256 startTime, uint256 endTime, uint256[] endWeights)` (public)





### `_updateWeightsGradually(contract IWeightedPool pool, uint256 startTime, uint256 endTime, uint256[] endWeights)` (internal)





### `withdrawCollectedManagementFees(contract IWeightedPool pool, address recipient)` (public)








