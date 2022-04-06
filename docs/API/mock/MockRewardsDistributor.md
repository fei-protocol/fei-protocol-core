## <span id="MockRewardsDistributor"></span> `MockRewardsDistributor`



- [`onlyOwner()`][Ownable-onlyOwner--]
- [`_setPendingAdmin(address _newPendingAdmin)`][MockRewardsDistributor-_setPendingAdmin-address-]
- [`_acceptAdmin()`][MockRewardsDistributor-_acceptAdmin--]
- [`_grantComp(address recipient, uint256 amount)`][MockRewardsDistributor-_grantComp-address-uint256-]
- [`_setCompSupplySpeed(address cToken, uint256 compSpeed)`][MockRewardsDistributor-_setCompSupplySpeed-address-uint256-]
- [`_setCompBorrowSpeed(address cToken, uint256 compSpeed)`][MockRewardsDistributor-_setCompBorrowSpeed-address-uint256-]
- [`_setContributorCompSpeed(address contributor, uint256 compSpeed)`][MockRewardsDistributor-_setContributorCompSpeed-address-uint256-]
- [`_addMarket(address cToken)`][MockRewardsDistributor-_addMarket-address-]
- [`compSupplySpeeds(address cToken)`][MockRewardsDistributor-compSupplySpeeds-address-]
- [`compBorrowSpeeds(address cToken)`][MockRewardsDistributor-compBorrowSpeeds-address-]
- [`setCompSupplySpeed(uint256 newSpeed)`][MockRewardsDistributor-setCompSupplySpeed-uint256-]
- [`setCompBorrowSpeed(uint256 newSpeed)`][MockRewardsDistributor-setCompBorrowSpeed-uint256-]
- [`_setImplementation(address implementation_)`][MockRewardsDistributor-_setImplementation-address-]
- [`constructor()`][Ownable-constructor--]
- [`owner()`][Ownable-owner--]
- [`renounceOwnership()`][Ownable-renounceOwnership--]
- [`transferOwnership(address newOwner)`][Ownable-transferOwnership-address-]
- [`_transferOwnership(address newOwner)`][Ownable-_transferOwnership-address-]
- [`_msgSender()`][Context-_msgSender--]
- [`_msgData()`][Context-_msgData--]
- [`AUTO_REWARDS_DISTRIBUTOR_ROLE()`][IRewardsDistributorAdmin-AUTO_REWARDS_DISTRIBUTOR_ROLE--]
- [`successSetAdmin(address pendingAdmin)`][MockRewardsDistributor-successSetAdmin-address-]
- [`successAcceptPendingAdmin(address newlyAppointedAdmin)`][MockRewardsDistributor-successAcceptPendingAdmin-address-]
- [`successGrantComp(address compGrantee, uint256 compAmount)`][MockRewardsDistributor-successGrantComp-address-uint256-]
- [`successSetCompSupplySpeed()`][MockRewardsDistributor-successSetCompSupplySpeed--]
- [`successSetCompBorrowSpeed()`][MockRewardsDistributor-successSetCompBorrowSpeed--]
- [`successSetCompContributorSpeed()`][MockRewardsDistributor-successSetCompContributorSpeed--]
- [`successAddMarket()`][MockRewardsDistributor-successAddMarket--]
- [`OwnershipTransferred(address previousOwner, address newOwner)`][Ownable-OwnershipTransferred-address-address-]
### <span id="MockRewardsDistributor-_setPendingAdmin-address-"></span> `_setPendingAdmin(address _newPendingAdmin)` (external)

Admin function to begin change of admin. The newPendingAdmin must call `_acceptAdmin` to finalize the transfer.


### <span id="MockRewardsDistributor-_acceptAdmin--"></span> `_acceptAdmin()` (external)

Admin function for pending admin to accept role and update admin

### <span id="MockRewardsDistributor-_grantComp-address-uint256-"></span> `_grantComp(address recipient, uint256 amount)` (external)

Note: If there is not enough COMP, we do not perform the transfer all.


### <span id="MockRewardsDistributor-_setCompSupplySpeed-address-uint256-"></span> `_setCompSupplySpeed(address cToken, uint256 compSpeed)` (external)



### <span id="MockRewardsDistributor-_setCompBorrowSpeed-address-uint256-"></span> `_setCompBorrowSpeed(address cToken, uint256 compSpeed)` (external)



### <span id="MockRewardsDistributor-_setContributorCompSpeed-address-uint256-"></span> `_setContributorCompSpeed(address contributor, uint256 compSpeed)` (external)



### <span id="MockRewardsDistributor-_addMarket-address-"></span> `_addMarket(address cToken)` (external)



### <span id="MockRewardsDistributor-compSupplySpeeds-address-"></span> `compSupplySpeeds(address cToken) → uint256` (external)



### <span id="MockRewardsDistributor-compBorrowSpeeds-address-"></span> `compBorrowSpeeds(address cToken) → uint256` (external)



### <span id="MockRewardsDistributor-setCompSupplySpeed-uint256-"></span> `setCompSupplySpeed(uint256 newSpeed)` (external)



### <span id="MockRewardsDistributor-setCompBorrowSpeed-uint256-"></span> `setCompBorrowSpeed(uint256 newSpeed)` (external)



### <span id="MockRewardsDistributor-_setImplementation-address-"></span> `_setImplementation(address implementation_)` (external)



### <span id="MockRewardsDistributor-successSetAdmin-address-"></span> `successSetAdmin(address pendingAdmin)`



### <span id="MockRewardsDistributor-successAcceptPendingAdmin-address-"></span> `successAcceptPendingAdmin(address newlyAppointedAdmin)`



### <span id="MockRewardsDistributor-successGrantComp-address-uint256-"></span> `successGrantComp(address compGrantee, uint256 compAmount)`



### <span id="MockRewardsDistributor-successSetCompSupplySpeed--"></span> `successSetCompSupplySpeed()`



### <span id="MockRewardsDistributor-successSetCompBorrowSpeed--"></span> `successSetCompBorrowSpeed()`



### <span id="MockRewardsDistributor-successSetCompContributorSpeed--"></span> `successSetCompContributorSpeed()`



### <span id="MockRewardsDistributor-successAddMarket--"></span> `successAddMarket()`



