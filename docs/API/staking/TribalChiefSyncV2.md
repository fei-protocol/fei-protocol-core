## <span id="TribalChiefSyncV2"></span> `TribalChiefSyncV2`



- [`update()`][TribalChiefSyncV2-update--]
- [`constructor(contract ITribalChief _tribalChief, contract IAutoRewardsDistributor _autoRewardsDistributor, contract ITimelock _timelock, uint256[] rewards, uint256[] timestamps)`][TribalChiefSyncV2-constructor-contract-ITribalChief-contract-IAutoRewardsDistributor-contract-ITimelock-uint256---uint256---]
- [`autoDecreaseRewards()`][TribalChiefSyncV2-autoDecreaseRewards--]
- [`isRewardDecreaseAvailable()`][TribalChiefSyncV2-isRewardDecreaseAvailable--]
- [`nextRewardTimestamp()`][TribalChiefSyncV2-nextRewardTimestamp--]
- [`nextRewardsRate()`][TribalChiefSyncV2-nextRewardsRate--]
- [`decreaseRewards(uint256 tribePerBlock, bytes32 salt)`][TribalChiefSyncV2-decreaseRewards-uint256-bytes32-]
- [`addPool(uint120 allocPoint, address stakedToken, address rewarder, struct TribalChiefSyncV2.RewardData[] rewardData, bytes32 salt)`][TribalChiefSyncV2-addPool-uint120-address-address-struct-TribalChiefSyncV2-RewardData---bytes32-]
- [`setPool(uint256 pid, uint120 allocPoint, contract IRewarder rewarder, bool overwrite, bytes32 salt)`][TribalChiefSyncV2-setPool-uint256-uint120-contract-IRewarder-bool-bytes32-]
- [`resetPool(uint256 pid, bytes32 salt)`][TribalChiefSyncV2-resetPool-uint256-bytes32-]
### <span id="TribalChiefSyncV2-update--"></span> `update()`



### <span id="TribalChiefSyncV2-constructor-contract-ITribalChief-contract-IAutoRewardsDistributor-contract-ITimelock-uint256---uint256---"></span> `constructor(contract ITribalChief _tribalChief, contract IAutoRewardsDistributor _autoRewardsDistributor, contract ITimelock _timelock, uint256[] rewards, uint256[] timestamps)` (public)



### <span id="TribalChiefSyncV2-autoDecreaseRewards--"></span> `autoDecreaseRewards()` (external)



### <span id="TribalChiefSyncV2-isRewardDecreaseAvailable--"></span> `isRewardDecreaseAvailable() → bool` (public)



### <span id="TribalChiefSyncV2-nextRewardTimestamp--"></span> `nextRewardTimestamp() → uint256` (public)



### <span id="TribalChiefSyncV2-nextRewardsRate--"></span> `nextRewardsRate() → uint256` (public)



### <span id="TribalChiefSyncV2-decreaseRewards-uint256-bytes32-"></span> `decreaseRewards(uint256 tribePerBlock, bytes32 salt)` (external)



### <span id="TribalChiefSyncV2-addPool-uint120-address-address-struct-TribalChiefSyncV2-RewardData---bytes32-"></span> `addPool(uint120 allocPoint, address stakedToken, address rewarder, struct TribalChiefSyncV2.RewardData[] rewardData, bytes32 salt)` (external)



### <span id="TribalChiefSyncV2-setPool-uint256-uint120-contract-IRewarder-bool-bytes32-"></span> `setPool(uint256 pid, uint120 allocPoint, contract IRewarder rewarder, bool overwrite, bytes32 salt)` (external)



### <span id="TribalChiefSyncV2-resetPool-uint256-bytes32-"></span> `resetPool(uint256 pid, bytes32 salt)` (external)



