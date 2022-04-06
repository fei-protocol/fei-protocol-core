## <span id="FeiTimedMinter"></span> `FeiTimedMinter`



- [`duringTime()`][Timed-duringTime--]
- [`afterTime()`][Timed-afterTime--]
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
- [`constructor(address _core, address _target, uint256 _incentive, uint256 _frequency, uint256 _initialMintAmount)`][FeiTimedMinter-constructor-address-address-uint256-uint256-uint256-]
- [`mint()`][FeiTimedMinter-mint--]
- [`mintAmount()`][FeiTimedMinter-mintAmount--]
- [`setTarget(address newTarget)`][FeiTimedMinter-setTarget-address-]
- [`setFrequency(uint256 newFrequency)`][FeiTimedMinter-setFrequency-uint256-]
- [`setMintAmount(uint256 newMintAmount)`][FeiTimedMinter-setMintAmount-uint256-]
- [`_setTarget(address newTarget)`][FeiTimedMinter-_setTarget-address-]
- [`_setMintAmount(uint256 newMintAmount)`][FeiTimedMinter-_setMintAmount-uint256-]
- [`_mintFei(address to, uint256 amountIn)`][FeiTimedMinter-_mintFei-address-uint256-]
- [`_afterMint()`][FeiTimedMinter-_afterMint--]
- [`setRateLimitPerSecond(uint256 newRateLimitPerSecond)`][RateLimited-setRateLimitPerSecond-uint256-]
- [`setBufferCap(uint256 newBufferCap)`][RateLimited-setBufferCap-uint256-]
- [`buffer()`][RateLimited-buffer--]
- [`_depleteBuffer(uint256 amount)`][RateLimited-_depleteBuffer-uint256-]
- [`_setRateLimitPerSecond(uint256 newRateLimitPerSecond)`][RateLimited-_setRateLimitPerSecond-uint256-]
- [`_setBufferCap(uint256 newBufferCap)`][RateLimited-_setBufferCap-uint256-]
- [`_resetBuffer()`][RateLimited-_resetBuffer--]
- [`_updateBufferStored()`][RateLimited-_updateBufferStored--]
- [`setIncentiveAmount(uint256 newIncentiveAmount)`][Incentivized-setIncentiveAmount-uint256-]
- [`_incentivize()`][Incentivized-_incentivize--]
- [`isTimeEnded()`][Timed-isTimeEnded--]
- [`remainingTime()`][Timed-remainingTime--]
- [`timeSinceStart()`][Timed-timeSinceStart--]
- [`isTimeStarted()`][Timed-isTimeStarted--]
- [`_initTimed()`][Timed-_initTimed--]
- [`_setDuration(uint256 newDuration)`][Timed-_setDuration-uint256-]
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
- [`MIN_MINT_FREQUENCY()`][IFeiTimedMinter-MIN_MINT_FREQUENCY--]
- [`MAX_MINT_FREQUENCY()`][IFeiTimedMinter-MAX_MINT_FREQUENCY--]
- [`target()`][IFeiTimedMinter-target--]
- [`BufferUsed(uint256 amountUsed, uint256 bufferRemaining)`][RateLimited-BufferUsed-uint256-uint256-]
- [`BufferCapUpdate(uint256 oldBufferCap, uint256 newBufferCap)`][RateLimited-BufferCapUpdate-uint256-uint256-]
- [`RateLimitPerSecondUpdate(uint256 oldRateLimitPerSecond, uint256 newRateLimitPerSecond)`][RateLimited-RateLimitPerSecondUpdate-uint256-uint256-]
- [`IncentiveUpdate(uint256 oldIncentiveAmount, uint256 newIncentiveAmount)`][Incentivized-IncentiveUpdate-uint256-uint256-]
- [`DurationUpdate(uint256 oldDuration, uint256 newDuration)`][Timed-DurationUpdate-uint256-uint256-]
- [`TimerReset(uint256 startTime)`][Timed-TimerReset-uint256-]
- [`Paused(address account)`][Pausable-Paused-address-]
- [`Unpaused(address account)`][Pausable-Unpaused-address-]
- [`CoreUpdate(address oldCore, address newCore)`][ICoreRef-CoreUpdate-address-address-]
- [`ContractAdminRoleUpdate(bytes32 oldContractAdminRole, bytes32 newContractAdminRole)`][ICoreRef-ContractAdminRoleUpdate-bytes32-bytes32-]
- [`FeiMinting(address caller, uint256 feiAmount)`][IFeiTimedMinter-FeiMinting-address-uint256-]
- [`TargetUpdate(address oldTarget, address newTarget)`][IFeiTimedMinter-TargetUpdate-address-address-]
- [`MintAmountUpdate(uint256 oldMintAmount, uint256 newMintAmount)`][IFeiTimedMinter-MintAmountUpdate-uint256-uint256-]
### <span id="FeiTimedMinter-constructor-address-address-uint256-uint256-uint256-"></span> `constructor(address _core, address _target, uint256 _incentive, uint256 _frequency, uint256 _initialMintAmount)` (public)



### <span id="FeiTimedMinter-mint--"></span> `mint()` (public)

timed and incentivized

### <span id="FeiTimedMinter-mintAmount--"></span> `mintAmount() → uint256` (public)



### <span id="FeiTimedMinter-setTarget-address-"></span> `setTarget(address newTarget)` (external)



### <span id="FeiTimedMinter-setFrequency-uint256-"></span> `setFrequency(uint256 newFrequency)` (external)



### <span id="FeiTimedMinter-setMintAmount-uint256-"></span> `setMintAmount(uint256 newMintAmount)` (external)



### <span id="FeiTimedMinter-_setTarget-address-"></span> `_setTarget(address newTarget)` (internal)



### <span id="FeiTimedMinter-_setMintAmount-uint256-"></span> `_setMintAmount(uint256 newMintAmount)` (internal)



### <span id="FeiTimedMinter-_mintFei-address-uint256-"></span> `_mintFei(address to, uint256 amountIn)` (internal)



### <span id="FeiTimedMinter-_afterMint--"></span> `_afterMint()` (internal)



