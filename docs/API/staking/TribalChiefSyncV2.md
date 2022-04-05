## `TribalChiefSyncV2`





### `update()`

Before an action, mass update all pools, after sync the autoRewardsDistributor




### `constructor(contract ITribalChief _tribalChief, contract IAutoRewardsDistributor _autoRewardsDistributor, contract ITimelock _timelock, uint256[] rewards, uint256[] timestamps)` (public)





### `autoDecreaseRewards()` (external)

Sync a rewards rate change automatically using pre-approved map



### `isRewardDecreaseAvailable() → bool` (public)





### `nextRewardTimestamp() → uint256` (public)





### `nextRewardsRate() → uint256` (public)





### `decreaseRewards(uint256 tribePerBlock, bytes32 salt)` (external)

Sync a rewards rate change



### `addPool(uint120 allocPoint, address stakedToken, address rewarder, struct TribalChiefSyncV2.RewardData[] rewardData, bytes32 salt)` (external)

Sync a pool addition



### `setPool(uint256 pid, uint120 allocPoint, contract IRewarder rewarder, bool overwrite, bytes32 salt)` (external)

Sync a pool set action



### `resetPool(uint256 pid, bytes32 salt)` (external)

Sync a pool reset rewards action





### `RewardData`


uint128 lockLength


uint128 rewardMultiplier



