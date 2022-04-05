## `MockRewardsDistributor`






### `_setPendingAdmin(address _newPendingAdmin)` (external)

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




### `compSupplySpeeds(address cToken) → uint256` (external)

view function to get the comp supply speeds from the rewards distributor contract




### `compBorrowSpeeds(address cToken) → uint256` (external)

view function to get the comp borrow speeds from the rewards distributor contract




### `setCompSupplySpeed(uint256 newSpeed)` (external)

admin function



### `setCompBorrowSpeed(uint256 newSpeed)` (external)





### `_setImplementation(address implementation_)` (external)

Set the implementation contract the RewardsDistributorDelegator delegate calls





### `successSetAdmin(address pendingAdmin)`





### `successAcceptPendingAdmin(address newlyAppointedAdmin)`





### `successGrantComp(address compGrantee, uint256 compAmount)`





### `successSetCompSupplySpeed()`





### `successSetCompBorrowSpeed()`





### `successSetCompContributorSpeed()`





### `successAddMarket()`







