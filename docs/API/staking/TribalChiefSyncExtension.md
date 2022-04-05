## `TribalChiefSyncExtension`





### `update(contract IAutoRewardsDistributor[] distributors)`






### `constructor(contract TribalChiefSyncV2 _tribalChiefSync)` (public)





### `autoDecreaseRewards(contract IAutoRewardsDistributor[] distributors)` (external)

Sync a rewards rate change automatically using pre-approved map



### `decreaseRewards(uint256 tribePerBlock, bytes32 salt, contract IAutoRewardsDistributor[] distributors)` (external)

Sync a rewards rate change



### `addPool(uint120 allocPoint, address stakedToken, address rewarder, struct TribalChiefSyncV2.RewardData[] rewardData, bytes32 salt, contract IAutoRewardsDistributor[] distributors)` (external)

Sync a pool addition



### `setPool(uint256 pid, uint120 allocPoint, contract IRewarder rewarder, bool overwrite, bytes32 salt, contract IAutoRewardsDistributor[] distributors)` (external)

Sync a pool set action



### `resetPool(uint256 pid, bytes32 salt, contract IAutoRewardsDistributor[] distributors)` (external)

Sync a pool reset rewards action






