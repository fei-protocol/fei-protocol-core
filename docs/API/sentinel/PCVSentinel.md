## <span id="PCVSentinel"></span> `PCVSentinel`

the PCV Sentinel should be granted the role Guardian


- [`nonReentrant()`][ReentrancyGuard-nonReentrant--]
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
- [`constructor(address _core)`][PCVSentinel-constructor-address-]
- [`isGuard(address guard)`][PCVSentinel-isGuard-address-]
- [`allGuards()`][PCVSentinel-allGuards--]
- [`knight(address guard)`][PCVSentinel-knight-address-]
- [`slay(address traitor)`][PCVSentinel-slay-address-]
- [`protec(address guard)`][PCVSentinel-protec-address-]
- [`receive()`][PCVSentinel-receive--]
- [`fallback()`][PCVSentinel-fallback--]
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
- [`Protected(address guard)`][IPCVSentinel-Protected-address-]
- [`GuardAdded(address guard)`][IPCVSentinel-GuardAdded-address-]
- [`GuardRemoved(address guard)`][IPCVSentinel-GuardRemoved-address-]
### <span id="PCVSentinel-constructor-address-"></span> `constructor(address _core)` (public)



### <span id="PCVSentinel-isGuard-address-"></span> `isGuard(address guard) → bool` (external)



### <span id="PCVSentinel-allGuards--"></span> `allGuards() → address[] all` (external)



### <span id="PCVSentinel-knight-address-"></span> `knight(address guard)` (external)



### <span id="PCVSentinel-slay-address-"></span> `slay(address traitor)` (external)



### <span id="PCVSentinel-protec-address-"></span> `protec(address guard)` (external)



### <span id="PCVSentinel-receive--"></span> `receive()` (external)

receive() and fallback() have been added and made payable for cases where the contract
needs to be able to receive eth as part of an operation - such as receiving an incentivization
(in eth) from a contract as part of operation. For similar (and not unlikely) edge cases,
the contract also has the capability of sending eth inside when instructed by a guard to do so.

### <span id="PCVSentinel-fallback--"></span> `fallback()` (external)



