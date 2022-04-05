## <span id="NamedStaticPCVDepositWrapper"></span> `NamedStaticPCVDepositWrapper`



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
- [`constructor(address _core, struct NamedStaticPCVDepositWrapper.DepositInfo[] newPCVDeposits)`][NamedStaticPCVDepositWrapper-constructor-address-struct-NamedStaticPCVDepositWrapper-DepositInfo---]
- [`_addDeposit(struct NamedStaticPCVDepositWrapper.DepositInfo newPCVDeposit)`][NamedStaticPCVDepositWrapper-_addDeposit-struct-NamedStaticPCVDepositWrapper-DepositInfo-]
- [`_editDeposit(uint256 index, string depositName, uint256 usdAmount, uint256 feiAmount, uint256 underlyingTokenAmount, address underlyingToken)`][NamedStaticPCVDepositWrapper-_editDeposit-uint256-string-uint256-uint256-uint256-address-]
- [`_removeDeposit(uint256 index)`][NamedStaticPCVDepositWrapper-_removeDeposit-uint256-]
- [`addDeposit(struct NamedStaticPCVDepositWrapper.DepositInfo newPCVDeposit)`][NamedStaticPCVDepositWrapper-addDeposit-struct-NamedStaticPCVDepositWrapper-DepositInfo-]
- [`bulkAddDeposits(struct NamedStaticPCVDepositWrapper.DepositInfo[] newPCVDeposits)`][NamedStaticPCVDepositWrapper-bulkAddDeposits-struct-NamedStaticPCVDepositWrapper-DepositInfo---]
- [`removeDeposit(uint256 index)`][NamedStaticPCVDepositWrapper-removeDeposit-uint256-]
- [`editDeposit(uint256 index, uint256 usdAmount, uint256 feiAmount, uint256 underlyingTokenAmount, string depositName, address underlying)`][NamedStaticPCVDepositWrapper-editDeposit-uint256-uint256-uint256-uint256-string-address-]
- [`numDeposits()`][NamedStaticPCVDepositWrapper-numDeposits--]
- [`resistantBalanceAndFei()`][NamedStaticPCVDepositWrapper-resistantBalanceAndFei--]
- [`balanceReportedIn()`][NamedStaticPCVDepositWrapper-balanceReportedIn--]
- [`getAllUnderlying()`][NamedStaticPCVDepositWrapper-getAllUnderlying--]
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
- [`balance()`][IPCVDepositBalances-balance--]
- [`BalanceUpdate(uint256 oldBalance, uint256 newBalance, uint256 oldFEIBalance, uint256 newFEIBalance)`][NamedStaticPCVDepositWrapper-BalanceUpdate-uint256-uint256-uint256-uint256-]
- [`DepositRemoved(uint256 index)`][NamedStaticPCVDepositWrapper-DepositRemoved-uint256-]
- [`DepositAdded(uint256 index, string depositName)`][NamedStaticPCVDepositWrapper-DepositAdded-uint256-string-]
- [`DepositChanged(uint256 index, string depositName)`][NamedStaticPCVDepositWrapper-DepositChanged-uint256-string-]
- [`Paused(address account)`][Pausable-Paused-address-]
- [`Unpaused(address account)`][Pausable-Unpaused-address-]
- [`CoreUpdate(address oldCore, address newCore)`][ICoreRef-CoreUpdate-address-address-]
- [`ContractAdminRoleUpdate(bytes32 oldContractAdminRole, bytes32 newContractAdminRole)`][ICoreRef-ContractAdminRoleUpdate-bytes32-bytes32-]
### <span id="NamedStaticPCVDepositWrapper-constructor-address-struct-NamedStaticPCVDepositWrapper-DepositInfo---"></span> `constructor(address _core, struct NamedStaticPCVDepositWrapper.DepositInfo[] newPCVDeposits)` (public)



### <span id="NamedStaticPCVDepositWrapper-_addDeposit-struct-NamedStaticPCVDepositWrapper-DepositInfo-"></span> `_addDeposit(struct NamedStaticPCVDepositWrapper.DepositInfo newPCVDeposit)` (internal)



### <span id="NamedStaticPCVDepositWrapper-_editDeposit-uint256-string-uint256-uint256-uint256-address-"></span> `_editDeposit(uint256 index, string depositName, uint256 usdAmount, uint256 feiAmount, uint256 underlyingTokenAmount, address underlyingToken)` (internal)



### <span id="NamedStaticPCVDepositWrapper-_removeDeposit-uint256-"></span> `_removeDeposit(uint256 index)` (internal)



### <span id="NamedStaticPCVDepositWrapper-addDeposit-struct-NamedStaticPCVDepositWrapper-DepositInfo-"></span> `addDeposit(struct NamedStaticPCVDepositWrapper.DepositInfo newPCVDeposit)` (external)



### <span id="NamedStaticPCVDepositWrapper-bulkAddDeposits-struct-NamedStaticPCVDepositWrapper-DepositInfo---"></span> `bulkAddDeposits(struct NamedStaticPCVDepositWrapper.DepositInfo[] newPCVDeposits)` (external)



### <span id="NamedStaticPCVDepositWrapper-removeDeposit-uint256-"></span> `removeDeposit(uint256 index)` (external)



### <span id="NamedStaticPCVDepositWrapper-editDeposit-uint256-uint256-uint256-uint256-string-address-"></span> `editDeposit(uint256 index, uint256 usdAmount, uint256 feiAmount, uint256 underlyingTokenAmount, string depositName, address underlying)` (external)



### <span id="NamedStaticPCVDepositWrapper-numDeposits--"></span> `numDeposits() → uint256` (public)



### <span id="NamedStaticPCVDepositWrapper-resistantBalanceAndFei--"></span> `resistantBalanceAndFei() → uint256, uint256` (public)



### <span id="NamedStaticPCVDepositWrapper-balanceReportedIn--"></span> `balanceReportedIn() → address` (public)



### <span id="NamedStaticPCVDepositWrapper-getAllUnderlying--"></span> `getAllUnderlying() → address[]` (public)



### <span id="NamedStaticPCVDepositWrapper-BalanceUpdate-uint256-uint256-uint256-uint256-"></span> `BalanceUpdate(uint256 oldBalance, uint256 newBalance, uint256 oldFEIBalance, uint256 newFEIBalance)`



### <span id="NamedStaticPCVDepositWrapper-DepositRemoved-uint256-"></span> `DepositRemoved(uint256 index)`



### <span id="NamedStaticPCVDepositWrapper-DepositAdded-uint256-string-"></span> `DepositAdded(uint256 index, string depositName)`



### <span id="NamedStaticPCVDepositWrapper-DepositChanged-uint256-string-"></span> `DepositChanged(uint256 index, string depositName)`



