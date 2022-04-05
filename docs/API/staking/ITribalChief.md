## `ITribalChief`






### `rewardMultipliers(uint256 _pid, uint128 _blocksLocked) → uint128` (external)

view only functions that return data on pools, user deposit(s), tribe distributed per block, and other constants



### `stakedToken(uint256 _index) → contract IERC20` (external)





### `poolInfo(uint256 _index) → uint256, uint256, uint128, uint120, bool` (external)





### `tribePerBlock() → uint256` (external)





### `pendingRewards(uint256 _pid, address _user) → uint256` (external)





### `getTotalStakedInPool(uint256 pid, address user) → uint256` (external)





### `openUserDeposits(uint256 pid, address user) → uint256` (external)





### `numPools() → uint256` (external)





### `totalAllocPoint() → uint256` (external)





### `SCALE_FACTOR() → uint256` (external)





### `deposit(uint256 _pid, uint256 _amount, uint64 _lockLength)` (external)

functions for users to deposit, withdraw and get rewards from our contracts



### `harvest(uint256 pid, address to)` (external)





### `withdrawAllAndHarvest(uint256 pid, address to)` (external)





### `withdrawFromDeposit(uint256 pid, uint256 amount, address to, uint256 index)` (external)





### `emergencyWithdraw(uint256 pid, address to)` (external)





### `updatePool(uint256 pid)` (external)

functions to update pools that can be called by anyone



### `massUpdatePools(uint256[] pids)` (external)





### `resetRewards(uint256 _pid)` (external)

functions to change and add pools and multipliers that can only be called by governor, guardian, or TribalChiefAdmin



### `set(uint256 _pid, uint120 _allocPoint, contract IRewarder _rewarder, bool overwrite)` (external)





### `add(uint120 allocPoint, contract IERC20 _stakedToken, contract IRewarder _rewarder, struct ITribalChief.RewardData[] rewardData)` (external)





### `governorWithdrawTribe(uint256 amount)` (external)





### `governorAddPoolMultiplier(uint256 _pid, uint64 lockLength, uint64 newRewardsMultiplier)` (external)





### `unlockPool(uint256 _pid)` (external)





### `lockPool(uint256 _pid)` (external)





### `updateBlockReward(uint256 newBlockReward)` (external)







### `RewardData`


uint128 lockLength


uint128 rewardMultiplier


### `PoolInfo`


uint256 virtualTotalSupply


uint256 accTribePerShare


uint128 lastRewardBlock


uint120 allocPoint


bool unlocked



