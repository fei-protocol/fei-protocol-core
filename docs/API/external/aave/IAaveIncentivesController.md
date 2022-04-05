## `IAaveIncentivesController`






### `setClaimer(address user, address claimer)` (external)



Whitelists an address to claim the rewards on behalf of another address


### `getClaimer(address user) → address` (external)



Returns the whitelisted claimer for a certain address (0x0 if not set)


### `configureAssets(address[] assets, uint256[] emissionsPerSecond)` (external)



Configure assets for a certain rewards emission


### `handleAction(address asset, uint256 userBalance, uint256 totalSupply)` (external)



Called by the corresponding asset on any update that affects the rewards distribution


### `getRewardsBalance(address[] assets, address user) → uint256` (external)



Returns the total of rewards of an user, already accrued + not yet accrued


### `claimRewards(address[] assets, uint256 amount, address to) → uint256` (external)



Claims reward for an user, on all the assets of the lending pool, accumulating the pending rewards


### `claimRewardsOnBehalf(address[] assets, uint256 amount, address user, address to) → uint256` (external)



Claims reward for an user on behalf, on all the assets of the lending pool, accumulating the pending rewards. The caller must
be whitelisted via "allowClaimOnBehalf" function by the RewardsAdmin role manager


### `getUserUnclaimedRewards(address user) → uint256` (external)



returns the unclaimed rewards of the user


### `REWARD_TOKEN() → address` (external)



for backward compatibility with previous implementation of the Incentives controller


### `RewardsAccrued(address user, uint256 amount)`





### `RewardsClaimed(address user, address to, address claimer, uint256 amount)`





### `ClaimerSet(address user, address claimer)`







