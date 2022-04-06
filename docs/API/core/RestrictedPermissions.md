## <span id="RestrictedPermissions"></span> `RestrictedPermissions`



- [`constructor(contract IPermissionsRead _core)`][RestrictedPermissions-constructor-contract-IPermissionsRead-]
- [`isMinter(address _address)`][RestrictedPermissions-isMinter-address-]
- [`isGuardian(address _address)`][RestrictedPermissions-isGuardian-address-]
- [`isGovernor(address)`][RestrictedPermissions-isGovernor-address-]
- [`isPCVController(address)`][RestrictedPermissions-isPCVController-address-]
- [`isBurner(address)`][RestrictedPermissions-isBurner-address-]
### <span id="RestrictedPermissions-constructor-contract-IPermissionsRead-"></span> `constructor(contract IPermissionsRead _core)` (public)



### <span id="RestrictedPermissions-isMinter-address-"></span> `isMinter(address _address) → bool` (external)



### <span id="RestrictedPermissions-isGuardian-address-"></span> `isGuardian(address _address) → bool` (public)



### <span id="RestrictedPermissions-isGovernor-address-"></span> `isGovernor(address) → bool` (external)

returns false rather than reverting so calls to onlyGuardianOrGovernor don't revert

### <span id="RestrictedPermissions-isPCVController-address-"></span> `isPCVController(address) → bool` (external)



### <span id="RestrictedPermissions-isBurner-address-"></span> `isBurner(address) → bool` (external)



