## <span id="FeiDAOTimelock"></span> `FeiDAOTimelock`



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
- [`constructor(address core_, address admin_, uint256 delay_, uint256 minDelay_)`][FeiDAOTimelock-constructor-address-address-uint256-uint256-]
- [`queueTransaction(address target, uint256 value, string signature, bytes data, uint256 eta)`][FeiDAOTimelock-queueTransaction-address-uint256-string-bytes-uint256-]
- [`vetoTransactions(address[] targets, uint256[] values, string[] signatures, bytes[] datas, uint256[] etas)`][FeiDAOTimelock-vetoTransactions-address---uint256---string---bytes---uint256---]
- [`executeTransaction(address target, uint256 value, string signature, bytes data, uint256 eta)`][FeiDAOTimelock-executeTransaction-address-uint256-string-bytes-uint256-]
- [`governorSetPendingAdmin(address newAdmin)`][FeiDAOTimelock-governorSetPendingAdmin-address-]
- [`rollback()`][FeiDAOTimelock-rollback--]
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
- [`receive()`][Timelock-receive--]
- [`setDelay(uint256 delay_)`][Timelock-setDelay-uint256-]
- [`acceptAdmin()`][Timelock-acceptAdmin--]
- [`setPendingAdmin(address pendingAdmin_)`][Timelock-setPendingAdmin-address-]
- [`cancelTransaction(address target, uint256 value, string signature, bytes data, uint256 eta)`][Timelock-cancelTransaction-address-uint256-string-bytes-uint256-]
- [`_cancelTransaction(address target, uint256 value, string signature, bytes data, uint256 eta)`][Timelock-_cancelTransaction-address-uint256-string-bytes-uint256-]
- [`getTxHash(address target, uint256 value, string signature, bytes data, uint256 eta)`][Timelock-getTxHash-address-uint256-string-bytes-uint256-]
- [`getBlockTimestamp()`][Timelock-getBlockTimestamp--]
- [`Paused(address account)`][Pausable-Paused-address-]
- [`Unpaused(address account)`][Pausable-Unpaused-address-]
- [`CoreUpdate(address oldCore, address newCore)`][ICoreRef-CoreUpdate-address-address-]
- [`ContractAdminRoleUpdate(bytes32 oldContractAdminRole, bytes32 newContractAdminRole)`][ICoreRef-ContractAdminRoleUpdate-bytes32-bytes32-]
- [`NewAdmin(address newAdmin)`][Timelock-NewAdmin-address-]
- [`NewPendingAdmin(address newPendingAdmin)`][Timelock-NewPendingAdmin-address-]
- [`NewDelay(uint256 newDelay)`][Timelock-NewDelay-uint256-]
- [`CancelTransaction(bytes32 txHash, address target, uint256 value, string signature, bytes data, uint256 eta)`][Timelock-CancelTransaction-bytes32-address-uint256-string-bytes-uint256-]
- [`ExecuteTransaction(bytes32 txHash, address target, uint256 value, string signature, bytes data, uint256 eta)`][Timelock-ExecuteTransaction-bytes32-address-uint256-string-bytes-uint256-]
- [`QueueTransaction(bytes32 txHash, address target, uint256 value, string signature, bytes data, uint256 eta)`][Timelock-QueueTransaction-bytes32-address-uint256-string-bytes-uint256-]
### <span id="FeiDAOTimelock-constructor-address-address-uint256-uint256-"></span> `constructor(address core_, address admin_, uint256 delay_, uint256 minDelay_)` (public)



### <span id="FeiDAOTimelock-queueTransaction-address-uint256-string-bytes-uint256-"></span> `queueTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) → bytes32` (public)



### <span id="FeiDAOTimelock-vetoTransactions-address---uint256---string---bytes---uint256---"></span> `vetoTransactions(address[] targets, uint256[] values, string[] signatures, bytes[] datas, uint256[] etas)` (public)



### <span id="FeiDAOTimelock-executeTransaction-address-uint256-string-bytes-uint256-"></span> `executeTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) → bytes` (public)



### <span id="FeiDAOTimelock-governorSetPendingAdmin-address-"></span> `governorSetPendingAdmin(address newAdmin)` (public)



### <span id="FeiDAOTimelock-rollback--"></span> `rollback()` (external)

guardian-only, and expires after the deadline. This function is here as a fallback in case something goes wrong.

