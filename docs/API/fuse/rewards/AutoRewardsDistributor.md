## `AutoRewardsDistributor`

Controller Contract to set tribe per block in Rewards Distributor Admin on Rari




### `constructor(address coreAddress, contract IRewardsDistributorAdmin _rewardsDistributorAdmin, contract ITribalChief _tribalChief, uint256 _tribalChiefRewardIndex, address _cTokenAddress, bool _isBorrowIncentivized)` (public)

constructor function




### `_deriveRequiredCompSpeed() → uint256 compSpeed` (internal)

helper function that gets all needed state from the TribalChief contract
based on this state, it then calculates what the compSpeed should be.



### `getNewRewardSpeed() → uint256 newCompSpeed, bool updateNeeded` (public)

function to get the new comp speed and figure out if an update is needed




### `setAutoRewardsDistribution()` (external)

function to automatically set the rewards speed on the RewardsDistributor contract
through the RewardsDistributorAdmin



### `setRewardsDistributorAdmin(contract IRewardsDistributorAdmin _newRewardsDistributorAdmin)` (external)

API to point to a new rewards distributor admin contract





### `SpeedChanged(uint256 newSpeed)`





### `RewardsDistributorAdminChanged(contract IRewardsDistributorAdmin oldRewardsDistributorAdmin, contract IRewardsDistributorAdmin newRewardsDistributorAdmin)`







