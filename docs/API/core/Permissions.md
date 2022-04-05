## <span id="Permissions"></span> `Permissions`



- [`onlyGovernor()`][Permissions-onlyGovernor--]
- [`onlyGuardian()`][Permissions-onlyGuardian--]
- [`onlyRole(bytes32 role)`][AccessControl-onlyRole-bytes32-]
- [`createRole(bytes32 role, bytes32 adminRole)`][Permissions-createRole-bytes32-bytes32-]
- [`grantMinter(address minter)`][Permissions-grantMinter-address-]
- [`grantBurner(address burner)`][Permissions-grantBurner-address-]
- [`grantPCVController(address pcvController)`][Permissions-grantPCVController-address-]
- [`grantGovernor(address governor)`][Permissions-grantGovernor-address-]
- [`grantGuardian(address guardian)`][Permissions-grantGuardian-address-]
- [`revokeMinter(address minter)`][Permissions-revokeMinter-address-]
- [`revokeBurner(address burner)`][Permissions-revokeBurner-address-]
- [`revokePCVController(address pcvController)`][Permissions-revokePCVController-address-]
- [`revokeGovernor(address governor)`][Permissions-revokeGovernor-address-]
- [`revokeGuardian(address guardian)`][Permissions-revokeGuardian-address-]
- [`revokeOverride(bytes32 role, address account)`][Permissions-revokeOverride-bytes32-address-]
- [`isMinter(address _address)`][Permissions-isMinter-address-]
- [`isBurner(address _address)`][Permissions-isBurner-address-]
- [`isPCVController(address _address)`][Permissions-isPCVController-address-]
- [`isGovernor(address _address)`][Permissions-isGovernor-address-]
- [`isGuardian(address _address)`][Permissions-isGuardian-address-]
- [`_setupGovernor(address governor)`][Permissions-_setupGovernor-address-]
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
- [`GUARDIAN_ROLE()`][IPermissions-GUARDIAN_ROLE--]
- [`GOVERN_ROLE()`][IPermissions-GOVERN_ROLE--]
- [`BURNER_ROLE()`][IPermissions-BURNER_ROLE--]
- [`MINTER_ROLE()`][IPermissions-MINTER_ROLE--]
- [`PCV_CONTROLLER_ROLE()`][IPermissions-PCV_CONTROLLER_ROLE--]
- [`_msgSender()`][Context-_msgSender--]
- [`_msgData()`][Context-_msgData--]
- [`RoleAdminChanged(bytes32 role, bytes32 previousAdminRole, bytes32 newAdminRole)`][IAccessControl-RoleAdminChanged-bytes32-bytes32-bytes32-]
- [`RoleGranted(bytes32 role, address account, address sender)`][IAccessControl-RoleGranted-bytes32-address-address-]
- [`RoleRevoked(bytes32 role, address account, address sender)`][IAccessControl-RoleRevoked-bytes32-address-address-]
### <span id="Permissions-onlyGovernor--"></span> `onlyGovernor()`



### <span id="Permissions-onlyGuardian--"></span> `onlyGuardian()`



### <span id="Permissions-createRole-bytes32-bytes32-"></span> `createRole(bytes32 role, bytes32 adminRole)` (external)

can also be used to update admin of existing role

### <span id="Permissions-grantMinter-address-"></span> `grantMinter(address minter)` (external)



### <span id="Permissions-grantBurner-address-"></span> `grantBurner(address burner)` (external)



### <span id="Permissions-grantPCVController-address-"></span> `grantPCVController(address pcvController)` (external)



### <span id="Permissions-grantGovernor-address-"></span> `grantGovernor(address governor)` (external)



### <span id="Permissions-grantGuardian-address-"></span> `grantGuardian(address guardian)` (external)



### <span id="Permissions-revokeMinter-address-"></span> `revokeMinter(address minter)` (external)



### <span id="Permissions-revokeBurner-address-"></span> `revokeBurner(address burner)` (external)



### <span id="Permissions-revokePCVController-address-"></span> `revokePCVController(address pcvController)` (external)



### <span id="Permissions-revokeGovernor-address-"></span> `revokeGovernor(address governor)` (external)



### <span id="Permissions-revokeGuardian-address-"></span> `revokeGuardian(address guardian)` (external)



### <span id="Permissions-revokeOverride-bytes32-address-"></span> `revokeOverride(bytes32 role, address account)` (external)



### <span id="Permissions-isMinter-address-"></span> `isMinter(address _address) → bool` (external)



### <span id="Permissions-isBurner-address-"></span> `isBurner(address _address) → bool` (external)



### <span id="Permissions-isPCVController-address-"></span> `isPCVController(address _address) → bool` (external)



### <span id="Permissions-isGovernor-address-"></span> `isGovernor(address _address) → bool` (public)



### <span id="Permissions-isGuardian-address-"></span> `isGuardian(address _address) → bool` (public)



### <span id="Permissions-_setupGovernor-address-"></span> `_setupGovernor(address governor)` (internal)



