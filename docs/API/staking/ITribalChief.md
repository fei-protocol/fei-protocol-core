## <span id="ITribalChief"></span> `ITribalChief`



- [`rewardMultipliers(uint256 _pid, uint128 _blocksLocked)`][ITribalChief-rewardMultipliers-uint256-uint128-]
- [`stakedToken(uint256 _index)`][ITribalChief-stakedToken-uint256-]
- [`poolInfo(uint256 _index)`][ITribalChief-poolInfo-uint256-]
- [`tribePerBlock()`][ITribalChief-tribePerBlock--]
- [`pendingRewards(uint256 _pid, address _user)`][ITribalChief-pendingRewards-uint256-address-]
- [`getTotalStakedInPool(uint256 pid, address user)`][ITribalChief-getTotalStakedInPool-uint256-address-]
- [`openUserDeposits(uint256 pid, address user)`][ITribalChief-openUserDeposits-uint256-address-]
- [`numPools()`][ITribalChief-numPools--]
- [`totalAllocPoint()`][ITribalChief-totalAllocPoint--]
- [`SCALE_FACTOR()`][ITribalChief-SCALE_FACTOR--]
- [`deposit(uint256 _pid, uint256 _amount, uint64 _lockLength)`][ITribalChief-deposit-uint256-uint256-uint64-]
- [`harvest(uint256 pid, address to)`][ITribalChief-harvest-uint256-address-]
- [`withdrawAllAndHarvest(uint256 pid, address to)`][ITribalChief-withdrawAllAndHarvest-uint256-address-]
- [`withdrawFromDeposit(uint256 pid, uint256 amount, address to, uint256 index)`][ITribalChief-withdrawFromDeposit-uint256-uint256-address-uint256-]
- [`emergencyWithdraw(uint256 pid, address to)`][ITribalChief-emergencyWithdraw-uint256-address-]
- [`updatePool(uint256 pid)`][ITribalChief-updatePool-uint256-]
- [`massUpdatePools(uint256[] pids)`][ITribalChief-massUpdatePools-uint256---]
- [`resetRewards(uint256 _pid)`][ITribalChief-resetRewards-uint256-]
- [`set(uint256 _pid, uint120 _allocPoint, contract IRewarder _rewarder, bool overwrite)`][ITribalChief-set-uint256-uint120-contract-IRewarder-bool-]
- [`add(uint120 allocPoint, contract IERC20 _stakedToken, contract IRewarder _rewarder, struct ITribalChief.RewardData[] rewardData)`][ITribalChief-add-uint120-contract-IERC20-contract-IRewarder-struct-ITribalChief-RewardData---]
- [`governorWithdrawTribe(uint256 amount)`][ITribalChief-governorWithdrawTribe-uint256-]
- [`governorAddPoolMultiplier(uint256 _pid, uint64 lockLength, uint64 newRewardsMultiplier)`][ITribalChief-governorAddPoolMultiplier-uint256-uint64-uint64-]
- [`unlockPool(uint256 _pid)`][ITribalChief-unlockPool-uint256-]
- [`lockPool(uint256 _pid)`][ITribalChief-lockPool-uint256-]
- [`updateBlockReward(uint256 newBlockReward)`][ITribalChief-updateBlockReward-uint256-]
### <span id="ITribalChief-rewardMultipliers-uint256-uint128-"></span> `rewardMultipliers(uint256 _pid, uint128 _blocksLocked) → uint128` (external)



### <span id="ITribalChief-stakedToken-uint256-"></span> `stakedToken(uint256 _index) → contract IERC20` (external)



### <span id="ITribalChief-poolInfo-uint256-"></span> `poolInfo(uint256 _index) → uint256, uint256, uint128, uint120, bool` (external)



### <span id="ITribalChief-tribePerBlock--"></span> `tribePerBlock() → uint256` (external)



### <span id="ITribalChief-pendingRewards-uint256-address-"></span> `pendingRewards(uint256 _pid, address _user) → uint256` (external)



### <span id="ITribalChief-getTotalStakedInPool-uint256-address-"></span> `getTotalStakedInPool(uint256 pid, address user) → uint256` (external)



### <span id="ITribalChief-openUserDeposits-uint256-address-"></span> `openUserDeposits(uint256 pid, address user) → uint256` (external)



### <span id="ITribalChief-numPools--"></span> `numPools() → uint256` (external)



### <span id="ITribalChief-totalAllocPoint--"></span> `totalAllocPoint() → uint256` (external)



### <span id="ITribalChief-SCALE_FACTOR--"></span> `SCALE_FACTOR() → uint256` (external)



### <span id="ITribalChief-deposit-uint256-uint256-uint64-"></span> `deposit(uint256 _pid, uint256 _amount, uint64 _lockLength)` (external)



### <span id="ITribalChief-harvest-uint256-address-"></span> `harvest(uint256 pid, address to)` (external)



### <span id="ITribalChief-withdrawAllAndHarvest-uint256-address-"></span> `withdrawAllAndHarvest(uint256 pid, address to)` (external)



### <span id="ITribalChief-withdrawFromDeposit-uint256-uint256-address-uint256-"></span> `withdrawFromDeposit(uint256 pid, uint256 amount, address to, uint256 index)` (external)



### <span id="ITribalChief-emergencyWithdraw-uint256-address-"></span> `emergencyWithdraw(uint256 pid, address to)` (external)



### <span id="ITribalChief-updatePool-uint256-"></span> `updatePool(uint256 pid)` (external)



### <span id="ITribalChief-massUpdatePools-uint256---"></span> `massUpdatePools(uint256[] pids)` (external)



### <span id="ITribalChief-resetRewards-uint256-"></span> `resetRewards(uint256 _pid)` (external)



### <span id="ITribalChief-set-uint256-uint120-contract-IRewarder-bool-"></span> `set(uint256 _pid, uint120 _allocPoint, contract IRewarder _rewarder, bool overwrite)` (external)



### <span id="ITribalChief-add-uint120-contract-IERC20-contract-IRewarder-struct-ITribalChief-RewardData---"></span> `add(uint120 allocPoint, contract IERC20 _stakedToken, contract IRewarder _rewarder, struct ITribalChief.RewardData[] rewardData)` (external)



### <span id="ITribalChief-governorWithdrawTribe-uint256-"></span> `governorWithdrawTribe(uint256 amount)` (external)



### <span id="ITribalChief-governorAddPoolMultiplier-uint256-uint64-uint64-"></span> `governorAddPoolMultiplier(uint256 _pid, uint64 lockLength, uint64 newRewardsMultiplier)` (external)



### <span id="ITribalChief-unlockPool-uint256-"></span> `unlockPool(uint256 _pid)` (external)



### <span id="ITribalChief-lockPool-uint256-"></span> `lockPool(uint256 _pid)` (external)



### <span id="ITribalChief-updateBlockReward-uint256-"></span> `updateBlockReward(uint256 newBlockReward)` (external)



