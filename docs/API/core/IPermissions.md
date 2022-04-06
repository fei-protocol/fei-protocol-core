## <span id="IPermissions"></span> `IPermissions`



- [`createRole(bytes32 role, bytes32 adminRole)`][IPermissions-createRole-bytes32-bytes32-]
- [`grantMinter(address minter)`][IPermissions-grantMinter-address-]
- [`grantBurner(address burner)`][IPermissions-grantBurner-address-]
- [`grantPCVController(address pcvController)`][IPermissions-grantPCVController-address-]
- [`grantGovernor(address governor)`][IPermissions-grantGovernor-address-]
- [`grantGuardian(address guardian)`][IPermissions-grantGuardian-address-]
- [`revokeMinter(address minter)`][IPermissions-revokeMinter-address-]
- [`revokeBurner(address burner)`][IPermissions-revokeBurner-address-]
- [`revokePCVController(address pcvController)`][IPermissions-revokePCVController-address-]
- [`revokeGovernor(address governor)`][IPermissions-revokeGovernor-address-]
- [`revokeGuardian(address guardian)`][IPermissions-revokeGuardian-address-]
- [`revokeOverride(bytes32 role, address account)`][IPermissions-revokeOverride-bytes32-address-]
- [`GUARDIAN_ROLE()`][IPermissions-GUARDIAN_ROLE--]
- [`GOVERN_ROLE()`][IPermissions-GOVERN_ROLE--]
- [`BURNER_ROLE()`][IPermissions-BURNER_ROLE--]
- [`MINTER_ROLE()`][IPermissions-MINTER_ROLE--]
- [`PCV_CONTROLLER_ROLE()`][IPermissions-PCV_CONTROLLER_ROLE--]
- [`isBurner(address _address)`][IPermissionsRead-isBurner-address-]
- [`isMinter(address _address)`][IPermissionsRead-isMinter-address-]
- [`isGovernor(address _address)`][IPermissionsRead-isGovernor-address-]
- [`isGuardian(address _address)`][IPermissionsRead-isGuardian-address-]
- [`isPCVController(address _address)`][IPermissionsRead-isPCVController-address-]
- [`hasRole(bytes32 role, address account)`][IAccessControl-hasRole-bytes32-address-]
- [`getRoleAdmin(bytes32 role)`][IAccessControl-getRoleAdmin-bytes32-]
- [`grantRole(bytes32 role, address account)`][IAccessControl-grantRole-bytes32-address-]
- [`revokeRole(bytes32 role, address account)`][IAccessControl-revokeRole-bytes32-address-]
- [`renounceRole(bytes32 role, address account)`][IAccessControl-renounceRole-bytes32-address-]
- [`RoleAdminChanged(bytes32 role, bytes32 previousAdminRole, bytes32 newAdminRole)`][IAccessControl-RoleAdminChanged-bytes32-bytes32-bytes32-]
- [`RoleGranted(bytes32 role, address account, address sender)`][IAccessControl-RoleGranted-bytes32-address-address-]
- [`RoleRevoked(bytes32 role, address account, address sender)`][IAccessControl-RoleRevoked-bytes32-address-address-]
### <span id="IPermissions-createRole-bytes32-bytes32-"></span> `createRole(bytes32 role, bytes32 adminRole)` (external)



### <span id="IPermissions-grantMinter-address-"></span> `grantMinter(address minter)` (external)



### <span id="IPermissions-grantBurner-address-"></span> `grantBurner(address burner)` (external)



### <span id="IPermissions-grantPCVController-address-"></span> `grantPCVController(address pcvController)` (external)



### <span id="IPermissions-grantGovernor-address-"></span> `grantGovernor(address governor)` (external)



### <span id="IPermissions-grantGuardian-address-"></span> `grantGuardian(address guardian)` (external)



### <span id="IPermissions-revokeMinter-address-"></span> `revokeMinter(address minter)` (external)



### <span id="IPermissions-revokeBurner-address-"></span> `revokeBurner(address burner)` (external)



### <span id="IPermissions-revokePCVController-address-"></span> `revokePCVController(address pcvController)` (external)



### <span id="IPermissions-revokeGovernor-address-"></span> `revokeGovernor(address governor)` (external)



### <span id="IPermissions-revokeGuardian-address-"></span> `revokeGuardian(address guardian)` (external)



### <span id="IPermissions-revokeOverride-bytes32-address-"></span> `revokeOverride(bytes32 role, address account)` (external)



### <span id="IPermissions-GUARDIAN_ROLE--"></span> `GUARDIAN_ROLE() → bytes32` (external)



### <span id="IPermissions-GOVERN_ROLE--"></span> `GOVERN_ROLE() → bytes32` (external)



### <span id="IPermissions-BURNER_ROLE--"></span> `BURNER_ROLE() → bytes32` (external)



### <span id="IPermissions-MINTER_ROLE--"></span> `MINTER_ROLE() → bytes32` (external)



### <span id="IPermissions-PCV_CONTROLLER_ROLE--"></span> `PCV_CONTROLLER_ROLE() → bytes32` (external)



