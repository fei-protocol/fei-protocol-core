## <span id="Core"></span> `Core`



- [`initializer()`][Initializable-initializer--]
- [`onlyInitializing()`][Initializable-onlyInitializing--]
- [`onlyGovernor()`][Permissions-onlyGovernor--]
- [`onlyGuardian()`][Permissions-onlyGuardian--]
- [`onlyRole(bytes32 role)`][AccessControl-onlyRole-bytes32-]
- [`init()`][Core-init--]
- [`setFei(address token)`][Core-setFei-address-]
- [`setTribe(address token)`][Core-setTribe-address-]
- [`allocateTribe(address to, uint256 amount)`][Core-allocateTribe-address-uint256-]
- [`_setFei(address token)`][Core-_setFei-address-]
- [`_setTribe(address token)`][Core-_setTribe-address-]
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
- [`fei()`][ICore-fei--]
- [`tribe()`][ICore-tribe--]
- [`GUARDIAN_ROLE()`][IPermissions-GUARDIAN_ROLE--]
- [`GOVERN_ROLE()`][IPermissions-GOVERN_ROLE--]
- [`BURNER_ROLE()`][IPermissions-BURNER_ROLE--]
- [`MINTER_ROLE()`][IPermissions-MINTER_ROLE--]
- [`PCV_CONTROLLER_ROLE()`][IPermissions-PCV_CONTROLLER_ROLE--]
- [`_msgSender()`][Context-_msgSender--]
- [`_msgData()`][Context-_msgData--]
- [`FeiUpdate(address _fei)`][ICore-FeiUpdate-address-]
- [`TribeUpdate(address _tribe)`][ICore-TribeUpdate-address-]
- [`GenesisGroupUpdate(address _genesisGroup)`][ICore-GenesisGroupUpdate-address-]
- [`TribeAllocation(address _to, uint256 _amount)`][ICore-TribeAllocation-address-uint256-]
- [`GenesisPeriodComplete(uint256 _timestamp)`][ICore-GenesisPeriodComplete-uint256-]
- [`RoleAdminChanged(bytes32 role, bytes32 previousAdminRole, bytes32 newAdminRole)`][IAccessControl-RoleAdminChanged-bytes32-bytes32-bytes32-]
- [`RoleGranted(bytes32 role, address account, address sender)`][IAccessControl-RoleGranted-bytes32-address-address-]
- [`RoleRevoked(bytes32 role, address account, address sender)`][IAccessControl-RoleRevoked-bytes32-address-address-]
### <span id="Core-init--"></span> `init()` (external)



### <span id="Core-setFei-address-"></span> `setFei(address token)` (external)



### <span id="Core-setTribe-address-"></span> `setTribe(address token)` (external)



### <span id="Core-allocateTribe-address-uint256-"></span> `allocateTribe(address to, uint256 amount)` (external)



### <span id="Core-_setFei-address-"></span> `_setFei(address token)` (internal)



### <span id="Core-_setTribe-address-"></span> `_setTribe(address token)` (internal)



