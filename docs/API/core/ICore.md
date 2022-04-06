## <span id="ICore"></span> `ICore`



- [`init()`][ICore-init--]
- [`setFei(address token)`][ICore-setFei-address-]
- [`setTribe(address token)`][ICore-setTribe-address-]
- [`allocateTribe(address to, uint256 amount)`][ICore-allocateTribe-address-uint256-]
- [`fei()`][ICore-fei--]
- [`tribe()`][ICore-tribe--]
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
- [`FeiUpdate(address _fei)`][ICore-FeiUpdate-address-]
- [`TribeUpdate(address _tribe)`][ICore-TribeUpdate-address-]
- [`GenesisGroupUpdate(address _genesisGroup)`][ICore-GenesisGroupUpdate-address-]
- [`TribeAllocation(address _to, uint256 _amount)`][ICore-TribeAllocation-address-uint256-]
- [`GenesisPeriodComplete(uint256 _timestamp)`][ICore-GenesisPeriodComplete-uint256-]
- [`RoleAdminChanged(bytes32 role, bytes32 previousAdminRole, bytes32 newAdminRole)`][IAccessControl-RoleAdminChanged-bytes32-bytes32-bytes32-]
- [`RoleGranted(bytes32 role, address account, address sender)`][IAccessControl-RoleGranted-bytes32-address-address-]
- [`RoleRevoked(bytes32 role, address account, address sender)`][IAccessControl-RoleRevoked-bytes32-address-address-]
### <span id="ICore-init--"></span> `init()` (external)



### <span id="ICore-setFei-address-"></span> `setFei(address token)` (external)



### <span id="ICore-setTribe-address-"></span> `setTribe(address token)` (external)



### <span id="ICore-allocateTribe-address-uint256-"></span> `allocateTribe(address to, uint256 amount)` (external)



### <span id="ICore-fei--"></span> `fei() → contract IFei` (external)



### <span id="ICore-tribe--"></span> `tribe() → contract IERC20` (external)



### <span id="ICore-FeiUpdate-address-"></span> `FeiUpdate(address _fei)`



### <span id="ICore-TribeUpdate-address-"></span> `TribeUpdate(address _tribe)`



### <span id="ICore-GenesisGroupUpdate-address-"></span> `GenesisGroupUpdate(address _genesisGroup)`



### <span id="ICore-TribeAllocation-address-uint256-"></span> `TribeAllocation(address _to, uint256 _amount)`



### <span id="ICore-GenesisPeriodComplete-uint256-"></span> `GenesisPeriodComplete(uint256 _timestamp)`



