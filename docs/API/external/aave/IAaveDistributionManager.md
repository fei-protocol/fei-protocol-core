## `IAaveDistributionManager`






### `setDistributionEnd(uint256 distributionEnd)` (external)



Sets the end date for the distribution


### `getDistributionEnd() → uint256` (external)



Gets the end date for the distribution


### `DISTRIBUTION_END() → uint256` (external)



for backwards compatibility with the previous DistributionManager used


### `getUserAssetData(address user, address asset) → uint256` (external)



Returns the data of an user on a distribution


### `getAssetData(address asset) → uint256, uint256, uint256` (external)



Returns the configuration of the distribution for a certain asset



### `AssetConfigUpdated(address asset, uint256 emission)`





### `AssetIndexUpdated(address asset, uint256 index)`





### `UserIndexUpdated(address user, address asset, uint256 index)`





### `DistributionEndUpdated(uint256 newDistributionEnd)`







