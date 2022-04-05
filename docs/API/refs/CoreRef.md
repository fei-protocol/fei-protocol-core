## `CoreRef`

defines some modifiers and utilities around interacting with Core



### `ifMinterSelf()`





### `onlyMinter()`





### `onlyBurner()`





### `onlyPCVController()`





### `onlyGovernorOrAdmin()`





### `onlyGovernor()`





### `onlyGuardianOrGovernor()`





### `isGovernorOrGuardianOrAdmin()`





### `onlyTribeRole(bytes32 role)`





### `hasAnyOfTwoRoles(bytes32 role1, bytes32 role2)`





### `hasAnyOfThreeRoles(bytes32 role1, bytes32 role2, bytes32 role3)`





### `hasAnyOfFourRoles(bytes32 role1, bytes32 role2, bytes32 role3, bytes32 role4)`





### `hasAnyOfFiveRoles(bytes32 role1, bytes32 role2, bytes32 role3, bytes32 role4, bytes32 role5)`





### `onlyFei()`






### `constructor(address coreAddress)` (internal)





### `_initialize(address)` (internal)





### `setContractAdminRole(bytes32 newContractAdminRole)` (external)

sets a new admin role for this contract



### `isContractAdmin(address _admin) → bool` (public)

returns whether a given address has the admin role for this contract



### `pause()` (public)

set pausable methods to paused



### `unpause()` (public)

set pausable methods to unpaused



### `core() → contract ICore` (public)

address of the Core contract referenced




### `fei() → contract IFei` (public)

address of the Fei contract referenced by Core




### `tribe() → contract IERC20` (public)

address of the Tribe contract referenced by Core




### `feiBalance() → uint256` (public)

fei balance of contract




### `tribeBalance() → uint256` (public)

tribe balance of contract




### `_burnFeiHeld()` (internal)





### `_mintFei(address to, uint256 amount)` (internal)





### `_setContractAdminRole(bytes32 newContractAdminRole)` (internal)








