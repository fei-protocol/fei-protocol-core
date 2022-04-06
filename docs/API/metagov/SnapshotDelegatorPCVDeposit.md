## <span id="SnapshotDelegatorPCVDeposit"></span> `SnapshotDelegatorPCVDeposit`



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
- [`constructor(address _core, contract IERC20 _token, bytes32 _spaceId, address _initialDelegate)`][SnapshotDelegatorPCVDeposit-constructor-address-contract-IERC20-bytes32-address-]
- [`withdraw(address to, uint256 amountUnderlying)`][SnapshotDelegatorPCVDeposit-withdraw-address-uint256-]
- [`deposit()`][SnapshotDelegatorPCVDeposit-deposit--]
- [`balance()`][SnapshotDelegatorPCVDeposit-balance--]
- [`balanceReportedIn()`][SnapshotDelegatorPCVDeposit-balanceReportedIn--]
- [`setSpaceId(bytes32 _spaceId)`][SnapshotDelegatorPCVDeposit-setSpaceId-bytes32-]
- [`setDelegate(address newDelegate)`][SnapshotDelegatorPCVDeposit-setDelegate-address-]
- [`clearDelegate()`][SnapshotDelegatorPCVDeposit-clearDelegate--]
- [`_delegate(address newDelegate)`][SnapshotDelegatorPCVDeposit-_delegate-address-]
- [`withdrawERC20(address token, address to, uint256 amount)`][PCVDeposit-withdrawERC20-address-address-uint256-]
- [`_withdrawERC20(address token, address to, uint256 amount)`][PCVDeposit-_withdrawERC20-address-address-uint256-]
- [`withdrawETH(address payable to, uint256 amountOut)`][PCVDeposit-withdrawETH-address-payable-uint256-]
- [`resistantBalanceAndFei()`][PCVDeposit-resistantBalanceAndFei--]
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
- [`DelegateUpdate(address oldDelegate, address newDelegate)`][SnapshotDelegatorPCVDeposit-DelegateUpdate-address-address-]
- [`Paused(address account)`][Pausable-Paused-address-]
- [`Unpaused(address account)`][Pausable-Unpaused-address-]
- [`CoreUpdate(address oldCore, address newCore)`][ICoreRef-CoreUpdate-address-address-]
- [`ContractAdminRoleUpdate(bytes32 oldContractAdminRole, bytes32 newContractAdminRole)`][ICoreRef-ContractAdminRoleUpdate-bytes32-bytes32-]
- [`Deposit(address _from, uint256 _amount)`][IPCVDeposit-Deposit-address-uint256-]
- [`Withdrawal(address _caller, address _to, uint256 _amount)`][IPCVDeposit-Withdrawal-address-address-uint256-]
- [`WithdrawERC20(address _caller, address _token, address _to, uint256 _amount)`][IPCVDeposit-WithdrawERC20-address-address-address-uint256-]
- [`WithdrawETH(address _caller, address _to, uint256 _amount)`][IPCVDeposit-WithdrawETH-address-address-uint256-]
### <span id="SnapshotDelegatorPCVDeposit-constructor-address-contract-IERC20-bytes32-address-"></span> `constructor(address _core, contract IERC20 _token, bytes32 _spaceId, address _initialDelegate)` (public)



### <span id="SnapshotDelegatorPCVDeposit-withdraw-address-uint256-"></span> `withdraw(address to, uint256 amountUnderlying)` (external)



### <span id="SnapshotDelegatorPCVDeposit-deposit--"></span> `deposit()` (external)



### <span id="SnapshotDelegatorPCVDeposit-balance--"></span> `balance() → uint256` (public)



### <span id="SnapshotDelegatorPCVDeposit-balanceReportedIn--"></span> `balanceReportedIn() → address` (public)



### <span id="SnapshotDelegatorPCVDeposit-setSpaceId-bytes32-"></span> `setSpaceId(bytes32 _spaceId)` (external)



### <span id="SnapshotDelegatorPCVDeposit-setDelegate-address-"></span> `setDelegate(address newDelegate)` (external)



### <span id="SnapshotDelegatorPCVDeposit-clearDelegate--"></span> `clearDelegate()` (external)



### <span id="SnapshotDelegatorPCVDeposit-_delegate-address-"></span> `_delegate(address newDelegate)` (internal)



### <span id="SnapshotDelegatorPCVDeposit-DelegateUpdate-address-address-"></span> `DelegateUpdate(address oldDelegate, address newDelegate)`



