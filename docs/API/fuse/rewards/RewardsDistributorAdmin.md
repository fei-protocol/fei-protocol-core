## <span id="RewardsDistributorAdmin"></span> `RewardsDistributorAdmin`



- [`onlyRole(bytes32 role)`][AccessControl-onlyRole-bytes32-]
- [`ifMinterSelf()`][CoreRef-ifMinterSelf--]
- [`onlyMinter()`][CoreRef-onlyMinter--]
- [`onlyBurner()`][CoreRef-onlyBurner--]
- [`onlyPCVController()`][CoreRef-onlyPCVController--]
- [`onlyGovernorOrAdmin()`][CoreRef-onlyGovernorOrAdmin--]
- [`onlyGovernor()`][CoreRef-onlyGovernor--]
- [`onlyGuardianOrGovernor()`][CoreRef-onlyGuardianOrGovernor--]
- [`isGovernorOrGuardianOrAdmin()`][CoreRef-isGovernorOrGuardianOrAdmin--]
- [`onlyTribeRole(bytes32 role)`][CoreRef-onlyTribeRole-bytes32-]
- [`hasAnyOfTwoRoles(bytes32 role1, bytes32 role2)`][CoreRef-hasAnyOfTwoRoles-bytes32-bytes32-]
- [`hasAnyOfThreeRoles(bytes32 role1, bytes32 role2, bytes32 role3)`][CoreRef-hasAnyOfThreeRoles-bytes32-bytes32-bytes32-]
- [`hasAnyOfFourRoles(bytes32 role1, bytes32 role2, bytes32 role3, bytes32 role4)`][CoreRef-hasAnyOfFourRoles-bytes32-bytes32-bytes32-bytes32-]
- [`hasAnyOfFiveRoles(bytes32 role1, bytes32 role2, bytes32 role3, bytes32 role4, bytes32 role5)`][CoreRef-hasAnyOfFiveRoles-bytes32-bytes32-bytes32-bytes32-bytes32-]
- [`onlyFei()`][CoreRef-onlyFei--]
- [`whenNotPaused()`][Pausable-whenNotPaused--]
- [`whenPaused()`][Pausable-whenPaused--]
- [`constructor(address coreAddress, contract IRewardsDistributorAdmin _rewardsDistributorContract, address[] _autoRewardDistributors)`][RewardsDistributorAdmin-constructor-address-contract-IRewardsDistributorAdmin-address---]
- [`_setPendingAdmin(address newPendingAdmin)`][RewardsDistributorAdmin-_setPendingAdmin-address-]
- [`_acceptAdmin()`][RewardsDistributorAdmin-_acceptAdmin--]
- [`_grantComp(address recipient, uint256 amount)`][RewardsDistributorAdmin-_grantComp-address-uint256-]
- [`_setCompSupplySpeed(address cToken, uint256 compSpeed)`][RewardsDistributorAdmin-_setCompSupplySpeed-address-uint256-]
- [`_setCompBorrowSpeed(address cToken, uint256 compSpeed)`][RewardsDistributorAdmin-_setCompBorrowSpeed-address-uint256-]
- [`guardianDisableSupplySpeed(address cToken)`][RewardsDistributorAdmin-guardianDisableSupplySpeed-address-]
- [`guardianDisableBorrowSpeed(address cToken)`][RewardsDistributorAdmin-guardianDisableBorrowSpeed-address-]
- [`_setContributorCompSpeed(address contributor, uint256 compSpeed)`][RewardsDistributorAdmin-_setContributorCompSpeed-address-uint256-]
- [`_addMarket(address cToken)`][RewardsDistributorAdmin-_addMarket-address-]
- [`_setImplementation(address implementation_)`][RewardsDistributorAdmin-_setImplementation-address-]
- [`compSupplySpeeds(address cToken)`][RewardsDistributorAdmin-compSupplySpeeds-address-]
- [`compBorrowSpeeds(address cToken)`][RewardsDistributorAdmin-compBorrowSpeeds-address-]
- [`becomeAdmin()`][RewardsDistributorAdmin-becomeAdmin--]
- [`supportsInterface(bytes4 interfaceId)`][AccessControlEnumerable-supportsInterface-bytes4-]
- [`getRoleMember(bytes32 role, uint256 index)`][AccessControlEnumerable-getRoleMember-bytes32-uint256-]
- [`getRoleMemberCount(bytes32 role)`][AccessControlEnumerable-getRoleMemberCount-bytes32-]
- [`_grantRole(bytes32 role, address account)`][AccessControlEnumerable-_grantRole-bytes32-address-]
- [`_revokeRole(bytes32 role, address account)`][AccessControlEnumerable-_revokeRole-bytes32-address-]
- [`hasRole(bytes32 role, address account)`][AccessControl-hasRole-bytes32-address-]
- [`_checkRole(bytes32 role, address account)`][AccessControl-_checkRole-bytes32-address-]
- [`getRoleAdmin(bytes32 role)`][AccessControl-getRoleAdmin-bytes32-]
- [`grantRole(bytes32 role, address account)`][AccessControl-grantRole-bytes32-address-]
- [`revokeRole(bytes32 role, address account)`][AccessControl-revokeRole-bytes32-address-]
- [`renounceRole(bytes32 role, address account)`][AccessControl-renounceRole-bytes32-address-]
- [`_setupRole(bytes32 role, address account)`][AccessControl-_setupRole-bytes32-address-]
- [`_setRoleAdmin(bytes32 role, bytes32 adminRole)`][AccessControl-_setRoleAdmin-bytes32-bytes32-]
- [`_initialize(address)`][CoreRef-_initialize-address-]
- [`setContractAdminRole(bytes32 newContractAdminRole)`][CoreRef-setContractAdminRole-bytes32-]
- [`isContractAdmin(address _admin)`][CoreRef-isContractAdmin-address-]
- [`pause()`][CoreRef-pause--]
- [`unpause()`][CoreRef-unpause--]
- [`core()`][CoreRef-core--]
- [`fei()`][CoreRef-fei--]
- [`tribe()`][CoreRef-tribe--]
- [`feiBalance()`][CoreRef-feiBalance--]
- [`tribeBalance()`][CoreRef-tribeBalance--]
- [`_burnFeiHeld()`][CoreRef-_burnFeiHeld--]
- [`_mintFei(address to, uint256 amount)`][CoreRef-_mintFei-address-uint256-]
- [`_setContractAdminRole(bytes32 newContractAdminRole)`][CoreRef-_setContractAdminRole-bytes32-]
- [`paused()`][Pausable-paused--]
- [`_pause()`][Pausable-_pause--]
- [`_unpause()`][Pausable-_unpause--]
- [`_msgSender()`][Context-_msgSender--]
- [`_msgData()`][Context-_msgData--]
- [`CONTRACT_ADMIN_ROLE()`][ICoreRef-CONTRACT_ADMIN_ROLE--]
- [`AUTO_REWARDS_DISTRIBUTOR_ROLE()`][IRewardsDistributorAdmin-AUTO_REWARDS_DISTRIBUTOR_ROLE--]
- [`RoleAdminChanged(bytes32 role, bytes32 previousAdminRole, bytes32 newAdminRole)`][IAccessControl-RoleAdminChanged-bytes32-bytes32-bytes32-]
- [`RoleGranted(bytes32 role, address account, address sender)`][IAccessControl-RoleGranted-bytes32-address-address-]
- [`RoleRevoked(bytes32 role, address account, address sender)`][IAccessControl-RoleRevoked-bytes32-address-address-]
- [`Paused(address account)`][Pausable-Paused-address-]
- [`Unpaused(address account)`][Pausable-Unpaused-address-]
- [`CoreUpdate(address oldCore, address newCore)`][ICoreRef-CoreUpdate-address-address-]
- [`ContractAdminRoleUpdate(bytes32 oldContractAdminRole, bytes32 newContractAdminRole)`][ICoreRef-ContractAdminRoleUpdate-bytes32-bytes32-]
### <span id="RewardsDistributorAdmin-constructor-address-contract-IRewardsDistributorAdmin-address---"></span> `constructor(address coreAddress, contract IRewardsDistributorAdmin _rewardsDistributorContract, address[] _autoRewardDistributors)` (public)



### <span id="RewardsDistributorAdmin-_setPendingAdmin-address-"></span> `_setPendingAdmin(address newPendingAdmin)` (external)

Admin function to begin change of admin. The newPendingAdmin must call `_acceptAdmin` to finalize the transfer.


### <span id="RewardsDistributorAdmin-_acceptAdmin--"></span> `_acceptAdmin()` (external)

Admin function for pending admin to accept role and update admin

### <span id="RewardsDistributorAdmin-_grantComp-address-uint256-"></span> `_grantComp(address recipient, uint256 amount)` (external)

Note: If there is not enough COMP, we do not perform the transfer all.


### <span id="RewardsDistributorAdmin-_setCompSupplySpeed-address-uint256-"></span> `_setCompSupplySpeed(address cToken, uint256 compSpeed)` (external)



### <span id="RewardsDistributorAdmin-_setCompBorrowSpeed-address-uint256-"></span> `_setCompBorrowSpeed(address cToken, uint256 compSpeed)` (external)



### <span id="RewardsDistributorAdmin-guardianDisableSupplySpeed-address-"></span> `guardianDisableSupplySpeed(address cToken)` (external)



### <span id="RewardsDistributorAdmin-guardianDisableBorrowSpeed-address-"></span> `guardianDisableBorrowSpeed(address cToken)` (external)



### <span id="RewardsDistributorAdmin-_setContributorCompSpeed-address-uint256-"></span> `_setContributorCompSpeed(address contributor, uint256 compSpeed)` (external)



### <span id="RewardsDistributorAdmin-_addMarket-address-"></span> `_addMarket(address cToken)` (external)



### <span id="RewardsDistributorAdmin-_setImplementation-address-"></span> `_setImplementation(address implementation_)` (external)



### <span id="RewardsDistributorAdmin-compSupplySpeeds-address-"></span> `compSupplySpeeds(address cToken) → uint256` (external)



### <span id="RewardsDistributorAdmin-compBorrowSpeeds-address-"></span> `compBorrowSpeeds(address cToken) → uint256` (external)



### <span id="RewardsDistributorAdmin-becomeAdmin--"></span> `becomeAdmin()` (public)



