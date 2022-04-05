## `IRewardsDistributorAdmin`






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

Set COMP speed for a single market




### `_setCompBorrowSpeed(address cToken, uint256 compSpeed)` (external)

Set COMP speed for a single market




### `_setContributorCompSpeed(address contributor, uint256 compSpeed)` (external)

Set COMP speed for a single contributor




### `_addMarket(address cToken)` (external)

Add a default market to claim rewards for in `claimRewards()`




### `compSupplySpeeds(address) → uint256` (external)

The portion of compRate that each market currently receives



### `compBorrowSpeeds(address) → uint256` (external)

The portion of compRate that each market currently receives



### `_setImplementation(address implementation_)` (external)

Set logic contract address



### `AUTO_REWARDS_DISTRIBUTOR_ROLE() → bytes32` (external)

Role for AutoRewardsDistributor contracts






