## <span id="RateLimitedMinter"></span> `RateLimitedMinter`



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
- [`constructor(uint256 _feiLimitPerSecond, uint256 _mintingBufferCap, bool _doPartialMint)`][RateLimitedMinter-constructor-uint256-uint256-bool-]
- [`_mintFei(address to, uint256 amount)`][RateLimitedMinter-_mintFei-address-uint256-]
- [`setRateLimitPerSecond(uint256 newRateLimitPerSecond)`][RateLimited-setRateLimitPerSecond-uint256-]
- [`setBufferCap(uint256 newBufferCap)`][RateLimited-setBufferCap-uint256-]
- [`buffer()`][RateLimited-buffer--]
- [`_depleteBuffer(uint256 amount)`][RateLimited-_depleteBuffer-uint256-]
- [`_setRateLimitPerSecond(uint256 newRateLimitPerSecond)`][RateLimited-_setRateLimitPerSecond-uint256-]
- [`_setBufferCap(uint256 newBufferCap)`][RateLimited-_setBufferCap-uint256-]
- [`_resetBuffer()`][RateLimited-_resetBuffer--]
- [`_updateBufferStored()`][RateLimited-_updateBufferStored--]
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
- [`_setContractAdminRole(bytes32 newContractAdminRole)`][CoreRef-_setContractAdminRole-bytes32-]
- [`paused()`][Pausable-paused--]
- [`_pause()`][Pausable-_pause--]
- [`_unpause()`][Pausable-_unpause--]
- [`_msgSender()`][Context-_msgSender--]
- [`_msgData()`][Context-_msgData--]
- [`CONTRACT_ADMIN_ROLE()`][ICoreRef-CONTRACT_ADMIN_ROLE--]
- [`BufferUsed(uint256 amountUsed, uint256 bufferRemaining)`][RateLimited-BufferUsed-uint256-uint256-]
- [`BufferCapUpdate(uint256 oldBufferCap, uint256 newBufferCap)`][RateLimited-BufferCapUpdate-uint256-uint256-]
- [`RateLimitPerSecondUpdate(uint256 oldRateLimitPerSecond, uint256 newRateLimitPerSecond)`][RateLimited-RateLimitPerSecondUpdate-uint256-uint256-]
- [`Paused(address account)`][Pausable-Paused-address-]
- [`Unpaused(address account)`][Pausable-Unpaused-address-]
- [`CoreUpdate(address oldCore, address newCore)`][ICoreRef-CoreUpdate-address-address-]
- [`ContractAdminRoleUpdate(bytes32 oldContractAdminRole, bytes32 newContractAdminRole)`][ICoreRef-ContractAdminRoleUpdate-bytes32-bytes32-]
### <span id="RateLimitedMinter-constructor-uint256-uint256-bool-"></span> `constructor(uint256 _feiLimitPerSecond, uint256 _mintingBufferCap, bool _doPartialMint)` (internal)



### <span id="RateLimitedMinter-_mintFei-address-uint256-"></span> `_mintFei(address to, uint256 amount)` (internal)



