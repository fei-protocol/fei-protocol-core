## <span id="FuseGuardian"></span> `FuseGuardian`



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
- [`constructor(address _core, contract Unitroller _comptroller)`][FuseGuardian-constructor-address-contract-Unitroller-]
- [`_setMarketSupplyCaps(contract CToken[] cTokens, uint256[] newSupplyCaps)`][FuseGuardian-_setMarketSupplyCaps-contract-CToken---uint256---]
- [`_setMarketSupplyCapsByUnderlying(address[] underlyings, uint256[] newSupplyCaps)`][FuseGuardian-_setMarketSupplyCapsByUnderlying-address---uint256---]
- [`_setMarketSupplyCapsInternal(contract CToken[] cTokens, uint256[] newSupplyCaps)`][FuseGuardian-_setMarketSupplyCapsInternal-contract-CToken---uint256---]
- [`_underlyingToCTokens(address[] underlyings)`][FuseGuardian-_underlyingToCTokens-address---]
- [`_setMarketBorrowCaps(contract CToken[] cTokens, uint256[] newBorrowCaps)`][FuseGuardian-_setMarketBorrowCaps-contract-CToken---uint256---]
- [`_setMarketBorrowCapsInternal(contract CToken[] cTokens, uint256[] newBorrowCaps)`][FuseGuardian-_setMarketBorrowCapsInternal-contract-CToken---uint256---]
- [`_setMarketBorrowCapsByUnderlying(address[] underlyings, uint256[] newBorrowCaps)`][FuseGuardian-_setMarketBorrowCapsByUnderlying-address---uint256---]
- [`_setBorrowCapGuardian(address newBorrowCapGuardian)`][FuseGuardian-_setBorrowCapGuardian-address-]
- [`_setPauseGuardian(address newPauseGuardian)`][FuseGuardian-_setPauseGuardian-address-]
- [`_setMintPausedByUnderlying(address underlying, bool state)`][FuseGuardian-_setMintPausedByUnderlying-address-bool-]
- [`_setMintPaused(contract CToken cToken, bool state)`][FuseGuardian-_setMintPaused-contract-CToken-bool-]
- [`_setMintPausedInternal(contract CToken cToken, bool state)`][FuseGuardian-_setMintPausedInternal-contract-CToken-bool-]
- [`_setBorrowPausedByUnderlying(address underlying, bool state)`][FuseGuardian-_setBorrowPausedByUnderlying-address-bool-]
- [`_setBorrowPausedInternal(contract CToken cToken, bool state)`][FuseGuardian-_setBorrowPausedInternal-contract-CToken-bool-]
- [`_setBorrowPaused(contract CToken cToken, bool state)`][FuseGuardian-_setBorrowPaused-contract-CToken-bool-]
- [`_setTransferPaused(bool state)`][FuseGuardian-_setTransferPaused-bool-]
- [`_setSeizePaused(bool state)`][FuseGuardian-_setSeizePaused-bool-]
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
### <span id="FuseGuardian-constructor-address-contract-Unitroller-"></span> `constructor(address _core, contract Unitroller _comptroller)` (public)



### <span id="FuseGuardian-_setMarketSupplyCaps-contract-CToken---uint256---"></span> `_setMarketSupplyCaps(contract CToken[] cTokens, uint256[] newSupplyCaps)` (external)

Admin or borrowCapGuardian function to set the supply caps. A supply cap of 0 corresponds to unlimited supplying.


### <span id="FuseGuardian-_setMarketSupplyCapsByUnderlying-address---uint256---"></span> `_setMarketSupplyCapsByUnderlying(address[] underlyings, uint256[] newSupplyCaps)` (external)



### <span id="FuseGuardian-_setMarketSupplyCapsInternal-contract-CToken---uint256---"></span> `_setMarketSupplyCapsInternal(contract CToken[] cTokens, uint256[] newSupplyCaps)` (internal)



### <span id="FuseGuardian-_underlyingToCTokens-address---"></span> `_underlyingToCTokens(address[] underlyings) → contract CToken[]` (internal)



### <span id="FuseGuardian-_setMarketBorrowCaps-contract-CToken---uint256---"></span> `_setMarketBorrowCaps(contract CToken[] cTokens, uint256[] newBorrowCaps)` (external)

Admin or borrowCapGuardian function to set the borrow caps. A borrow cap of 0 corresponds to unlimited borrowing.


### <span id="FuseGuardian-_setMarketBorrowCapsInternal-contract-CToken---uint256---"></span> `_setMarketBorrowCapsInternal(contract CToken[] cTokens, uint256[] newBorrowCaps)` (internal)



### <span id="FuseGuardian-_setMarketBorrowCapsByUnderlying-address---uint256---"></span> `_setMarketBorrowCapsByUnderlying(address[] underlyings, uint256[] newBorrowCaps)` (external)



### <span id="FuseGuardian-_setBorrowCapGuardian-address-"></span> `_setBorrowCapGuardian(address newBorrowCapGuardian)` (external)



### <span id="FuseGuardian-_setPauseGuardian-address-"></span> `_setPauseGuardian(address newPauseGuardian) → uint256` (external)



### <span id="FuseGuardian-_setMintPausedByUnderlying-address-bool-"></span> `_setMintPausedByUnderlying(address underlying, bool state) → bool` (external)



### <span id="FuseGuardian-_setMintPaused-contract-CToken-bool-"></span> `_setMintPaused(contract CToken cToken, bool state) → bool` (external)



### <span id="FuseGuardian-_setMintPausedInternal-contract-CToken-bool-"></span> `_setMintPausedInternal(contract CToken cToken, bool state) → bool` (internal)



### <span id="FuseGuardian-_setBorrowPausedByUnderlying-address-bool-"></span> `_setBorrowPausedByUnderlying(address underlying, bool state) → bool` (external)



### <span id="FuseGuardian-_setBorrowPausedInternal-contract-CToken-bool-"></span> `_setBorrowPausedInternal(contract CToken cToken, bool state) → bool` (internal)



### <span id="FuseGuardian-_setBorrowPaused-contract-CToken-bool-"></span> `_setBorrowPaused(contract CToken cToken, bool state) → bool` (external)



### <span id="FuseGuardian-_setTransferPaused-bool-"></span> `_setTransferPaused(bool state) → bool` (external)



### <span id="FuseGuardian-_setSeizePaused-bool-"></span> `_setSeizePaused(bool state) → bool` (external)



