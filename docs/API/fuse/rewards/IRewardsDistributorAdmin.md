## <span id="IRewardsDistributorAdmin"></span> `IRewardsDistributorAdmin`



- [`_setPendingAdmin(address newPendingAdmin)`][IRewardsDistributorAdmin-_setPendingAdmin-address-]
- [`_acceptAdmin()`][IRewardsDistributorAdmin-_acceptAdmin--]
- [`_grantComp(address recipient, uint256 amount)`][IRewardsDistributorAdmin-_grantComp-address-uint256-]
- [`_setCompSupplySpeed(address cToken, uint256 compSpeed)`][IRewardsDistributorAdmin-_setCompSupplySpeed-address-uint256-]
- [`_setCompBorrowSpeed(address cToken, uint256 compSpeed)`][IRewardsDistributorAdmin-_setCompBorrowSpeed-address-uint256-]
- [`_setContributorCompSpeed(address contributor, uint256 compSpeed)`][IRewardsDistributorAdmin-_setContributorCompSpeed-address-uint256-]
- [`_addMarket(address cToken)`][IRewardsDistributorAdmin-_addMarket-address-]
- [`compSupplySpeeds(address)`][IRewardsDistributorAdmin-compSupplySpeeds-address-]
- [`compBorrowSpeeds(address)`][IRewardsDistributorAdmin-compBorrowSpeeds-address-]
- [`_setImplementation(address implementation_)`][IRewardsDistributorAdmin-_setImplementation-address-]
- [`AUTO_REWARDS_DISTRIBUTOR_ROLE()`][IRewardsDistributorAdmin-AUTO_REWARDS_DISTRIBUTOR_ROLE--]
### <span id="IRewardsDistributorAdmin-_setPendingAdmin-address-"></span> `_setPendingAdmin(address newPendingAdmin)` (external)

Admin function to begin change of admin. The newPendingAdmin must call `_acceptAdmin` to finalize the transfer.


### <span id="IRewardsDistributorAdmin-_acceptAdmin--"></span> `_acceptAdmin()` (external)

Admin function for pending admin to accept role and update admin

### <span id="IRewardsDistributorAdmin-_grantComp-address-uint256-"></span> `_grantComp(address recipient, uint256 amount)` (external)

Note: If there is not enough COMP, we do not perform the transfer all.


### <span id="IRewardsDistributorAdmin-_setCompSupplySpeed-address-uint256-"></span> `_setCompSupplySpeed(address cToken, uint256 compSpeed)` (external)



### <span id="IRewardsDistributorAdmin-_setCompBorrowSpeed-address-uint256-"></span> `_setCompBorrowSpeed(address cToken, uint256 compSpeed)` (external)



### <span id="IRewardsDistributorAdmin-_setContributorCompSpeed-address-uint256-"></span> `_setContributorCompSpeed(address contributor, uint256 compSpeed)` (external)



### <span id="IRewardsDistributorAdmin-_addMarket-address-"></span> `_addMarket(address cToken)` (external)



### <span id="IRewardsDistributorAdmin-compSupplySpeeds-address-"></span> `compSupplySpeeds(address) → uint256` (external)



### <span id="IRewardsDistributorAdmin-compBorrowSpeeds-address-"></span> `compBorrowSpeeds(address) → uint256` (external)



### <span id="IRewardsDistributorAdmin-_setImplementation-address-"></span> `_setImplementation(address implementation_)` (external)



### <span id="IRewardsDistributorAdmin-AUTO_REWARDS_DISTRIBUTOR_ROLE--"></span> `AUTO_REWARDS_DISTRIBUTOR_ROLE() → bytes32` (external)



