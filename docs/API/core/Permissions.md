## `Permissions`





### `onlyGovernor()`





### `onlyGuardian()`






### `createRole(bytes32 role, bytes32 adminRole)` (external)

creates a new role to be maintained


can also be used to update admin of existing role

### `grantMinter(address minter)` (external)

grants minter role to address




### `grantBurner(address burner)` (external)

grants burner role to address




### `grantPCVController(address pcvController)` (external)

grants controller role to address




### `grantGovernor(address governor)` (external)

grants governor role to address




### `grantGuardian(address guardian)` (external)

grants guardian role to address




### `revokeMinter(address minter)` (external)

revokes minter role from address




### `revokeBurner(address burner)` (external)

revokes burner role from address




### `revokePCVController(address pcvController)` (external)

revokes pcvController role from address




### `revokeGovernor(address governor)` (external)

revokes governor role from address




### `revokeGuardian(address guardian)` (external)

revokes guardian role from address




### `revokeOverride(bytes32 role, address account)` (external)

revokes a role from address




### `isMinter(address _address) → bool` (external)

checks if address is a minter




### `isBurner(address _address) → bool` (external)

checks if address is a burner




### `isPCVController(address _address) → bool` (external)

checks if address is a controller




### `isGovernor(address _address) → bool` (public)

checks if address is a governor




### `isGuardian(address _address) → bool` (public)

checks if address is a guardian




### `_setupGovernor(address governor)` (internal)








