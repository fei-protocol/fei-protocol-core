## <span id="IAaveIncentivesController"></span> `IAaveIncentivesController`



- [`setClaimer(address user, address claimer)`][IAaveIncentivesController-setClaimer-address-address-]
- [`getClaimer(address user)`][IAaveIncentivesController-getClaimer-address-]
- [`configureAssets(address[] assets, uint256[] emissionsPerSecond)`][IAaveIncentivesController-configureAssets-address---uint256---]
- [`handleAction(address asset, uint256 userBalance, uint256 totalSupply)`][IAaveIncentivesController-handleAction-address-uint256-uint256-]
- [`getRewardsBalance(address[] assets, address user)`][IAaveIncentivesController-getRewardsBalance-address---address-]
- [`claimRewards(address[] assets, uint256 amount, address to)`][IAaveIncentivesController-claimRewards-address---uint256-address-]
- [`claimRewardsOnBehalf(address[] assets, uint256 amount, address user, address to)`][IAaveIncentivesController-claimRewardsOnBehalf-address---uint256-address-address-]
- [`getUserUnclaimedRewards(address user)`][IAaveIncentivesController-getUserUnclaimedRewards-address-]
- [`REWARD_TOKEN()`][IAaveIncentivesController-REWARD_TOKEN--]
- [`setDistributionEnd(uint256 distributionEnd)`][IAaveDistributionManager-setDistributionEnd-uint256-]
- [`getDistributionEnd()`][IAaveDistributionManager-getDistributionEnd--]
- [`DISTRIBUTION_END()`][IAaveDistributionManager-DISTRIBUTION_END--]
- [`getUserAssetData(address user, address asset)`][IAaveDistributionManager-getUserAssetData-address-address-]
- [`getAssetData(address asset)`][IAaveDistributionManager-getAssetData-address-]
- [`RewardsAccrued(address user, uint256 amount)`][IAaveIncentivesController-RewardsAccrued-address-uint256-]
- [`RewardsClaimed(address user, address to, address claimer, uint256 amount)`][IAaveIncentivesController-RewardsClaimed-address-address-address-uint256-]
- [`ClaimerSet(address user, address claimer)`][IAaveIncentivesController-ClaimerSet-address-address-]
- [`AssetConfigUpdated(address asset, uint256 emission)`][IAaveDistributionManager-AssetConfigUpdated-address-uint256-]
- [`AssetIndexUpdated(address asset, uint256 index)`][IAaveDistributionManager-AssetIndexUpdated-address-uint256-]
- [`UserIndexUpdated(address user, address asset, uint256 index)`][IAaveDistributionManager-UserIndexUpdated-address-address-uint256-]
- [`DistributionEndUpdated(uint256 newDistributionEnd)`][IAaveDistributionManager-DistributionEndUpdated-uint256-]
### <span id="IAaveIncentivesController-setClaimer-address-address-"></span> `setClaimer(address user, address claimer)` (external)

Whitelists an address to claim the rewards on behalf of another address


### <span id="IAaveIncentivesController-getClaimer-address-"></span> `getClaimer(address user) → address` (external)

Returns the whitelisted claimer for a certain address (0x0 if not set)


### <span id="IAaveIncentivesController-configureAssets-address---uint256---"></span> `configureAssets(address[] assets, uint256[] emissionsPerSecond)` (external)

Configure assets for a certain rewards emission


### <span id="IAaveIncentivesController-handleAction-address-uint256-uint256-"></span> `handleAction(address asset, uint256 userBalance, uint256 totalSupply)` (external)

Called by the corresponding asset on any update that affects the rewards distribution


### <span id="IAaveIncentivesController-getRewardsBalance-address---address-"></span> `getRewardsBalance(address[] assets, address user) → uint256` (external)

Returns the total of rewards of an user, already accrued + not yet accrued


### <span id="IAaveIncentivesController-claimRewards-address---uint256-address-"></span> `claimRewards(address[] assets, uint256 amount, address to) → uint256` (external)

Claims reward for an user, on all the assets of the lending pool, accumulating the pending rewards


### <span id="IAaveIncentivesController-claimRewardsOnBehalf-address---uint256-address-address-"></span> `claimRewardsOnBehalf(address[] assets, uint256 amount, address user, address to) → uint256` (external)

Claims reward for an user on behalf, on all the assets of the lending pool, accumulating the pending rewards. The caller must
be whitelisted via "allowClaimOnBehalf" function by the RewardsAdmin role manager


### <span id="IAaveIncentivesController-getUserUnclaimedRewards-address-"></span> `getUserUnclaimedRewards(address user) → uint256` (external)

returns the unclaimed rewards of the user


### <span id="IAaveIncentivesController-REWARD_TOKEN--"></span> `REWARD_TOKEN() → address` (external)

for backward compatibility with previous implementation of the Incentives controller

### <span id="IAaveIncentivesController-RewardsAccrued-address-uint256-"></span> `RewardsAccrued(address user, uint256 amount)`



### <span id="IAaveIncentivesController-RewardsClaimed-address-address-address-uint256-"></span> `RewardsClaimed(address user, address to, address claimer, uint256 amount)`



### <span id="IAaveIncentivesController-ClaimerSet-address-address-"></span> `ClaimerSet(address user, address claimer)`



