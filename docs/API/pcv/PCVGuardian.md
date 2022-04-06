## <span id="PCVGuardian"></span> `PCVGuardian`



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
- [`constructor(address _core, address[] _safeAddresses)`][PCVGuardian-constructor-address-address---]
- [`isSafeAddress(address pcvDeposit)`][PCVGuardian-isSafeAddress-address-]
- [`getSafeAddresses()`][PCVGuardian-getSafeAddresses--]
- [`setSafeAddress(address pcvDeposit)`][PCVGuardian-setSafeAddress-address-]
- [`setSafeAddresses(address[] _safeAddresses)`][PCVGuardian-setSafeAddresses-address---]
- [`unsetSafeAddress(address pcvDeposit)`][PCVGuardian-unsetSafeAddress-address-]
- [`unsetSafeAddresses(address[] _safeAddresses)`][PCVGuardian-unsetSafeAddresses-address---]
- [`withdrawToSafeAddress(address pcvDeposit, address safeAddress, uint256 amount, bool pauseAfter, bool depositAfter)`][PCVGuardian-withdrawToSafeAddress-address-address-uint256-bool-bool-]
- [`withdrawETHToSafeAddress(address pcvDeposit, address payable safeAddress, uint256 amount, bool pauseAfter, bool depositAfter)`][PCVGuardian-withdrawETHToSafeAddress-address-address-payable-uint256-bool-bool-]
- [`withdrawERC20ToSafeAddress(address pcvDeposit, address safeAddress, address token, uint256 amount, bool pauseAfter, bool depositAfter)`][PCVGuardian-withdrawERC20ToSafeAddress-address-address-address-uint256-bool-bool-]
- [`_setSafeAddress(address anAddress)`][PCVGuardian-_setSafeAddress-address-]
- [`_unsetSafeAddress(address anAddress)`][PCVGuardian-_unsetSafeAddress-address-]
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
- [`Paused(address account)`][Pausable-Paused-address-]
- [`Unpaused(address account)`][Pausable-Unpaused-address-]
- [`CoreUpdate(address oldCore, address newCore)`][ICoreRef-CoreUpdate-address-address-]
- [`ContractAdminRoleUpdate(bytes32 oldContractAdminRole, bytes32 newContractAdminRole)`][ICoreRef-ContractAdminRoleUpdate-bytes32-bytes32-]
- [`SafeAddressAdded(address safeAddress)`][IPCVGuardian-SafeAddressAdded-address-]
- [`SafeAddressRemoved(address safeAddress)`][IPCVGuardian-SafeAddressRemoved-address-]
- [`PCVGuardianWithdrawal(address pcvDeposit, address destination, uint256 amount)`][IPCVGuardian-PCVGuardianWithdrawal-address-address-uint256-]
- [`PCVGuardianETHWithdrawal(address pcvDeposit, address destination, uint256 amount)`][IPCVGuardian-PCVGuardianETHWithdrawal-address-address-uint256-]
- [`PCVGuardianERC20Withdrawal(address pcvDeposit, address destination, address token, uint256 amount)`][IPCVGuardian-PCVGuardianERC20Withdrawal-address-address-address-uint256-]
### <span id="PCVGuardian-constructor-address-address---"></span> `constructor(address _core, address[] _safeAddresses)` (public)



### <span id="PCVGuardian-isSafeAddress-address-"></span> `isSafeAddress(address pcvDeposit) → bool` (public)



### <span id="PCVGuardian-getSafeAddresses--"></span> `getSafeAddresses() → address[]` (public)



### <span id="PCVGuardian-setSafeAddress-address-"></span> `setSafeAddress(address pcvDeposit)` (external)



### <span id="PCVGuardian-setSafeAddresses-address---"></span> `setSafeAddresses(address[] _safeAddresses)` (external)



### <span id="PCVGuardian-unsetSafeAddress-address-"></span> `unsetSafeAddress(address pcvDeposit)` (external)



### <span id="PCVGuardian-unsetSafeAddresses-address---"></span> `unsetSafeAddresses(address[] _safeAddresses)` (external)



### <span id="PCVGuardian-withdrawToSafeAddress-address-address-uint256-bool-bool-"></span> `withdrawToSafeAddress(address pcvDeposit, address safeAddress, uint256 amount, bool pauseAfter, bool depositAfter)` (external)



### <span id="PCVGuardian-withdrawETHToSafeAddress-address-address-payable-uint256-bool-bool-"></span> `withdrawETHToSafeAddress(address pcvDeposit, address payable safeAddress, uint256 amount, bool pauseAfter, bool depositAfter)` (external)



### <span id="PCVGuardian-withdrawERC20ToSafeAddress-address-address-address-uint256-bool-bool-"></span> `withdrawERC20ToSafeAddress(address pcvDeposit, address safeAddress, address token, uint256 amount, bool pauseAfter, bool depositAfter)` (external)



### <span id="PCVGuardian-_setSafeAddress-address-"></span> `_setSafeAddress(address anAddress)` (internal)



### <span id="PCVGuardian-_unsetSafeAddress-address-"></span> `_unsetSafeAddress(address anAddress)` (internal)



