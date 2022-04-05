## <span id="PCVSplitter"></span> `PCVSplitter`



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
- [`constructor(address[] _pcvDeposits, uint256[] _ratios)`][PCVSplitter-constructor-address---uint256---]
- [`checkAllocation(address[] _pcvDeposits, uint256[] _ratios)`][PCVSplitter-checkAllocation-address---uint256---]
- [`getAllocation()`][PCVSplitter-getAllocation--]
- [`setAllocation(address[] _allocations, uint256[] _ratios)`][PCVSplitter-setAllocation-address---uint256---]
- [`_allocateSingle(uint256 amount, address pcvDeposit)`][PCVSplitter-_allocateSingle-uint256-address-]
- [`_setAllocation(address[] _pcvDeposits, uint256[] _ratios)`][PCVSplitter-_setAllocation-address---uint256---]
- [`_allocate(uint256 total)`][PCVSplitter-_allocate-uint256-]
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
- [`AllocationUpdate(address[] oldPCVDeposits, uint256[] oldRatios, address[] newPCVDeposits, uint256[] newRatios)`][PCVSplitter-AllocationUpdate-address---uint256---address---uint256---]
- [`Allocate(address caller, uint256 amount)`][PCVSplitter-Allocate-address-uint256-]
- [`Paused(address account)`][Pausable-Paused-address-]
- [`Unpaused(address account)`][Pausable-Unpaused-address-]
- [`CoreUpdate(address oldCore, address newCore)`][ICoreRef-CoreUpdate-address-address-]
- [`ContractAdminRoleUpdate(bytes32 oldContractAdminRole, bytes32 newContractAdminRole)`][ICoreRef-ContractAdminRoleUpdate-bytes32-bytes32-]
### <span id="PCVSplitter-constructor-address---uint256---"></span> `constructor(address[] _pcvDeposits, uint256[] _ratios)` (internal)



### <span id="PCVSplitter-checkAllocation-address---uint256---"></span> `checkAllocation(address[] _pcvDeposits, uint256[] _ratios)` (public)



### <span id="PCVSplitter-getAllocation--"></span> `getAllocation() → address[], uint256[]` (public)



### <span id="PCVSplitter-setAllocation-address---uint256---"></span> `setAllocation(address[] _allocations, uint256[] _ratios)` (external)



### <span id="PCVSplitter-_allocateSingle-uint256-address-"></span> `_allocateSingle(uint256 amount, address pcvDeposit)` (internal)



### <span id="PCVSplitter-_setAllocation-address---uint256---"></span> `_setAllocation(address[] _pcvDeposits, uint256[] _ratios)` (internal)



### <span id="PCVSplitter-_allocate-uint256-"></span> `_allocate(uint256 total)` (internal)



### <span id="PCVSplitter-AllocationUpdate-address---uint256---address---uint256---"></span> `AllocationUpdate(address[] oldPCVDeposits, uint256[] oldRatios, address[] newPCVDeposits, uint256[] newRatios)`



### <span id="PCVSplitter-Allocate-address-uint256-"></span> `Allocate(address caller, uint256 amount)`



