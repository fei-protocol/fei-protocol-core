## `RestrictedPermissions`






### `constructor(contract IPermissionsRead _core)` (public)





### `isMinter(address _address) → bool` (external)

checks if address is a minter




### `isGuardian(address _address) → bool` (public)

checks if address is a guardian




### `isGovernor(address) → bool` (external)



returns false rather than reverting so calls to onlyGuardianOrGovernor don't revert

### `isPCVController(address) → bool` (external)





### `isBurner(address) → bool` (external)








