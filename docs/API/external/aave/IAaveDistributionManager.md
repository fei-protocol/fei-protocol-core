## <span id="IAaveDistributionManager"></span> `IAaveDistributionManager`



- [`setDistributionEnd(uint256 distributionEnd)`][IAaveDistributionManager-setDistributionEnd-uint256-]
- [`getDistributionEnd()`][IAaveDistributionManager-getDistributionEnd--]
- [`DISTRIBUTION_END()`][IAaveDistributionManager-DISTRIBUTION_END--]
- [`getUserAssetData(address user, address asset)`][IAaveDistributionManager-getUserAssetData-address-address-]
- [`getAssetData(address asset)`][IAaveDistributionManager-getAssetData-address-]
- [`AssetConfigUpdated(address asset, uint256 emission)`][IAaveDistributionManager-AssetConfigUpdated-address-uint256-]
- [`AssetIndexUpdated(address asset, uint256 index)`][IAaveDistributionManager-AssetIndexUpdated-address-uint256-]
- [`UserIndexUpdated(address user, address asset, uint256 index)`][IAaveDistributionManager-UserIndexUpdated-address-address-uint256-]
- [`DistributionEndUpdated(uint256 newDistributionEnd)`][IAaveDistributionManager-DistributionEndUpdated-uint256-]
### <span id="IAaveDistributionManager-setDistributionEnd-uint256-"></span> `setDistributionEnd(uint256 distributionEnd)` (external)

Sets the end date for the distribution


### <span id="IAaveDistributionManager-getDistributionEnd--"></span> `getDistributionEnd() → uint256` (external)

Gets the end date for the distribution


### <span id="IAaveDistributionManager-DISTRIBUTION_END--"></span> `DISTRIBUTION_END() → uint256` (external)

for backwards compatibility with the previous DistributionManager used


### <span id="IAaveDistributionManager-getUserAssetData-address-address-"></span> `getUserAssetData(address user, address asset) → uint256` (external)

Returns the data of an user on a distribution


### <span id="IAaveDistributionManager-getAssetData-address-"></span> `getAssetData(address asset) → uint256, uint256, uint256` (external)

Returns the configuration of the distribution for a certain asset


### <span id="IAaveDistributionManager-AssetConfigUpdated-address-uint256-"></span> `AssetConfigUpdated(address asset, uint256 emission)`



### <span id="IAaveDistributionManager-AssetIndexUpdated-address-uint256-"></span> `AssetIndexUpdated(address asset, uint256 index)`



### <span id="IAaveDistributionManager-UserIndexUpdated-address-address-uint256-"></span> `UserIndexUpdated(address user, address asset, uint256 index)`



### <span id="IAaveDistributionManager-DistributionEndUpdated-uint256-"></span> `DistributionEndUpdated(uint256 newDistributionEnd)`



