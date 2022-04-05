## `TribalChief`

The idea for this TribalChief contract is to be the owner of tribe token
that is deposited into this contract.
This contract was forked from sushiswap and has been modified to distribute staking rewards in tribe.
All legacy code that relied on MasterChef V1 has been removed so that this contract will pay out staking rewards in tribe.
The assumption this code makes is that this MasterChief contract will be funded before going live and offering staking rewards.
This contract will not have the ability to mint tribe.




### `constructor(address coreAddress)` (public)

The way this function is constructed, you will not be able to
call initialize after this function is constructed, effectively
only allowing TribalChief to be used through delegate calls.




### `initialize(address _core, contract IERC20 _tribe)` (external)





### `updateBlockReward(uint256 newBlockReward)` (external)

Allows governor to change the amount of tribe per block
make sure to call the update pool function before hitting this function
this will ensure that all of the rewards a user earned previously get paid out




### `lockPool(uint256 _pid)` (external)

Allows governor to lock the pool so the users cannot withdraw
until their lockup period is over




### `unlockPool(uint256 _pid)` (external)

Allows governor to unlock the pool so that users can withdraw
before their tokens have been locked for the entire lockup period




### `governorAddPoolMultiplier(uint256 _pid, uint64 lockLength, uint64 newRewardsMultiplier)` (external)

Allows governor to change the pool multiplier
Unlocks the pool if the new multiplier is greater than the old one




### `governorWithdrawTribe(uint256 amount)` (external)

sends tokens back to governance treasury. Only callable by governance




### `numPools() → uint256` (public)

Returns the number of pools.



### `openUserDeposits(uint256 pid, address user) → uint256` (public)

Returns the number of user deposits in a single pool.



### `getTotalStakedInPool(uint256 pid, address user) → uint256` (public)

Returns the amount a user deposited in a single pool.



### `add(uint120 allocPoint, contract IERC20 _stakedToken, contract IRewarder _rewarder, struct TribalChief.RewardData[] rewardData)` (external)

Add a new pool. Can only be called by the governor.




### `set(uint256 _pid, uint120 _allocPoint, contract IRewarder _rewarder, bool overwrite)` (public)

Update the given pool's TRIBE allocation point and `IRewarder` contract.
Can only be called by the governor.




### `resetRewards(uint256 _pid)` (public)

Reset the given pool's TRIBE allocation to 0 and unlock the pool.
Can only be called by the governor or guardian.




### `pendingRewards(uint256 _pid, address _user) → uint256` (external)

View function to see all pending TRIBE on frontend.




### `massUpdatePools(uint256[] pids)` (external)

Update reward variables for all pools. Be careful of gas spending!




### `tribePerBlock() → uint256` (public)

Calculates and returns the `amount` of TRIBE per block.



### `updatePool(uint256 pid)` (public)

Update reward variables of the given pool.




### `deposit(uint256 pid, uint256 amount, uint64 lockLength)` (public)

Deposit tokens to earn TRIBE allocation.




### `withdrawAllAndHarvest(uint256 pid, address to)` (external)

Withdraw staked tokens from pool.




### `withdrawFromDeposit(uint256 pid, uint256 amount, address to, uint256 index)` (public)

Withdraw tokens from pool.




### `harvest(uint256 pid, address to)` (public)

Harvest proceeds for transaction sender to `to`.




### `emergencyWithdraw(uint256 pid, address to)` (public)

Withdraw without caring about rewards. EMERGENCY ONLY.





### `Deposit(address user, uint256 pid, uint256 amount, uint256 depositID)`





### `Withdraw(address user, uint256 pid, uint256 amount, address to)`





### `EmergencyWithdraw(address user, uint256 pid, uint256 amount, address to)`





### `Harvest(address user, uint256 pid, uint256 amount)`





### `LogPoolAddition(uint256 pid, uint256 allocPoint, contract IERC20 stakedToken, contract IRewarder rewarder)`





### `LogSetPool(uint256 pid, uint256 allocPoint, contract IRewarder rewarder, bool overwrite)`





### `LogPoolMultiplier(uint256 pid, uint128 lockLength, uint256 multiplier)`





### `LogUpdatePool(uint256 pid, uint128 lastRewardBlock, uint256 lpSupply, uint256 accTribePerShare)`





### `TribeWithdraw(uint256 amount)`

tribe withdraw event



### `NewTribePerBlock(uint256 amount)`





### `PoolLocked(bool locked, uint256 pid)`






### `UserInfo`


int256 rewardDebt


uint256 virtualAmount


### `DepositInfo`


uint256 amount


uint128 unlockBlock


uint128 multiplier


### `PoolInfo`


uint256 virtualTotalSupply


uint256 accTribePerShare


uint128 lastRewardBlock


uint120 allocPoint


bool unlocked


### `RewardData`


uint128 lockLength


uint128 rewardMultiplier



