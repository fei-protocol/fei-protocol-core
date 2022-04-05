## `RewardsDistributorAdmin`

this contract has its own internal ACL. The reasons for doing this
and not leveraging core are twofold. One, it simplifies devops operations around adding
and removing users, and two, by being self contained, it is more efficient as it does not need
to make external calls to figure out who has a particular role.




### `constructor(address coreAddress, contract IRewardsDistributorAdmin _rewardsDistributorContract, address[] _autoRewardDistributors)` (public)





### `_setPendingAdmin(address newPendingAdmin)` (external)

Begins transfer of admin rights. The newPendingAdmin must call `_acceptAdmin` to finalize the transfer.


Admin function to begin change of admin. The newPendingAdmin must call `_acceptAdmin` to finalize the transfer.


### `_acceptAdmin()` (external)

Accepts transfer of admin rights. msg.sender must be pendingAdmin


Admin function for pending admin to accept role and update admin

### `_grantComp(address recipient, uint256 amount)` (external)

Transfer COMP to the recipient


Note: If there is not enough COMP, we do not perform the transfer all.


### `_setCompSupplySpeed(address cToken, uint256 compSpeed)` (external)

Set COMP speed for a single market.
Callable only by users with auto rewards distributor role




### `_setCompBorrowSpeed(address cToken, uint256 compSpeed)` (external)

Set COMP speed for a single market
Callable only by users with auto rewards distributor role




### `guardianDisableSupplySpeed(address cToken)` (external)

Set COMP supply speed for a single market to 0
Callable only by the guardian or governor




### `guardianDisableBorrowSpeed(address cToken)` (external)

Set COMP borrow speed for a single market to 0
Callable only by the guardian or governor




### `_setContributorCompSpeed(address contributor, uint256 compSpeed)` (external)

Set COMP speed for a single contributor




### `_addMarket(address cToken)` (external)

Add a default market to claim rewards for in `claimRewards()`




### `_setImplementation(address implementation_)` (external)

Set the implementation contract the RewardsDistributorDelegator delegate calls




### `compSupplySpeeds(address cToken) → uint256` (external)

view function to get the comp supply speeds from the rewards distributor contract




### `compBorrowSpeeds(address cToken) → uint256` (external)

view function to get the comp borrow speeds from the rewards distributor contract




### `becomeAdmin()` (public)

allow admin or governor to assume auto reward distributor admin role






