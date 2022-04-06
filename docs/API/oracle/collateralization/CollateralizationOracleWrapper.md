## <span id="CollateralizationOracleWrapper"></span> `CollateralizationOracleWrapper`



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
- [`duringTime()`][Timed-duringTime--]
- [`afterTime()`][Timed-afterTime--]
- [`constructor(address _core, uint256 _validityDuration)`][CollateralizationOracleWrapper-constructor-address-uint256-]
- [`initialize(address _core, address _collateralizationOracle, uint256 _validityDuration, uint256 _deviationThresholdBasisPoints)`][CollateralizationOracleWrapper-initialize-address-address-uint256-uint256-]
- [`setCollateralizationOracle(address _newCollateralizationOracle)`][CollateralizationOracleWrapper-setCollateralizationOracle-address-]
- [`setDeviationThresholdBasisPoints(uint256 _newDeviationThresholdBasisPoints)`][CollateralizationOracleWrapper-setDeviationThresholdBasisPoints-uint256-]
- [`setValidityDuration(uint256 _validityDuration)`][CollateralizationOracleWrapper-setValidityDuration-uint256-]
- [`setReadPauseOverride(bool _readPauseOverride)`][CollateralizationOracleWrapper-setReadPauseOverride-bool-]
- [`setCache(uint256 _cachedProtocolControlledValue, uint256 _cachedUserCirculatingFei, int256 _cachedProtocolEquity)`][CollateralizationOracleWrapper-setCache-uint256-uint256-int256-]
- [`update()`][CollateralizationOracleWrapper-update--]
- [`updateIfOutdated()`][CollateralizationOracleWrapper-updateIfOutdated--]
- [`_update()`][CollateralizationOracleWrapper-_update--]
- [`_setCache(uint256 _cachedProtocolControlledValue, uint256 _cachedUserCirculatingFei, int256 _cachedProtocolEquity)`][CollateralizationOracleWrapper-_setCache-uint256-uint256-int256-]
- [`isOutdated()`][CollateralizationOracleWrapper-isOutdated--]
- [`read()`][CollateralizationOracleWrapper-read--]
- [`isExceededDeviationThreshold()`][CollateralizationOracleWrapper-isExceededDeviationThreshold--]
- [`_isExceededDeviationThreshold(uint256 cached, uint256 current)`][CollateralizationOracleWrapper-_isExceededDeviationThreshold-uint256-uint256-]
- [`isOutdatedOrExceededDeviationThreshold()`][CollateralizationOracleWrapper-isOutdatedOrExceededDeviationThreshold--]
- [`pcvStats()`][CollateralizationOracleWrapper-pcvStats--]
- [`isOvercollateralized()`][CollateralizationOracleWrapper-isOvercollateralized--]
- [`pcvStatsCurrent()`][CollateralizationOracleWrapper-pcvStatsCurrent--]
- [`_readNotPaused()`][CollateralizationOracleWrapper-_readNotPaused--]
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
- [`cachedProtocolControlledValue()`][ICollateralizationOracleWrapper-cachedProtocolControlledValue--]
- [`cachedUserCirculatingFei()`][ICollateralizationOracleWrapper-cachedUserCirculatingFei--]
- [`cachedProtocolEquity()`][ICollateralizationOracleWrapper-cachedProtocolEquity--]
- [`deviationThresholdBasisPoints()`][ICollateralizationOracleWrapper-deviationThresholdBasisPoints--]
- [`collateralizationOracle()`][ICollateralizationOracleWrapper-collateralizationOracle--]
- [`readPauseOverride()`][ICollateralizationOracleWrapper-readPauseOverride--]
- [`isTimeEnded()`][Timed-isTimeEnded--]
- [`remainingTime()`][Timed-remainingTime--]
- [`timeSinceStart()`][Timed-timeSinceStart--]
- [`isTimeStarted()`][Timed-isTimeStarted--]
- [`_initTimed()`][Timed-_initTimed--]
- [`_setDuration(uint256 newDuration)`][Timed-_setDuration-uint256-]
- [`Paused(address account)`][Pausable-Paused-address-]
- [`Unpaused(address account)`][Pausable-Unpaused-address-]
- [`CoreUpdate(address oldCore, address newCore)`][ICoreRef-CoreUpdate-address-address-]
- [`ContractAdminRoleUpdate(bytes32 oldContractAdminRole, bytes32 newContractAdminRole)`][ICoreRef-ContractAdminRoleUpdate-bytes32-bytes32-]
- [`CachedValueUpdate(address from, uint256 protocolControlledValue, uint256 userCirculatingFei, int256 protocolEquity)`][ICollateralizationOracleWrapper-CachedValueUpdate-address-uint256-uint256-int256-]
- [`CollateralizationOracleUpdate(address from, address oldOracleAddress, address newOracleAddress)`][ICollateralizationOracleWrapper-CollateralizationOracleUpdate-address-address-address-]
- [`DeviationThresholdUpdate(address from, uint256 oldThreshold, uint256 newThreshold)`][ICollateralizationOracleWrapper-DeviationThresholdUpdate-address-uint256-uint256-]
- [`ReadPauseOverrideUpdate(bool readPauseOverride)`][ICollateralizationOracleWrapper-ReadPauseOverrideUpdate-bool-]
- [`Update(uint256 _peg)`][IOracle-Update-uint256-]
- [`DurationUpdate(uint256 oldDuration, uint256 newDuration)`][Timed-DurationUpdate-uint256-uint256-]
- [`TimerReset(uint256 startTime)`][Timed-TimerReset-uint256-]
### <span id="CollateralizationOracleWrapper-constructor-address-uint256-"></span> `constructor(address _core, uint256 _validityDuration)` (public)



### <span id="CollateralizationOracleWrapper-initialize-address-address-uint256-uint256-"></span> `initialize(address _core, address _collateralizationOracle, uint256 _validityDuration, uint256 _deviationThresholdBasisPoints)` (public)



### <span id="CollateralizationOracleWrapper-setCollateralizationOracle-address-"></span> `setCollateralizationOracle(address _newCollateralizationOracle)` (external)



### <span id="CollateralizationOracleWrapper-setDeviationThresholdBasisPoints-uint256-"></span> `setDeviationThresholdBasisPoints(uint256 _newDeviationThresholdBasisPoints)` (external)



### <span id="CollateralizationOracleWrapper-setValidityDuration-uint256-"></span> `setValidityDuration(uint256 _validityDuration)` (external)



### <span id="CollateralizationOracleWrapper-setReadPauseOverride-bool-"></span> `setReadPauseOverride(bool _readPauseOverride)` (external)



### <span id="CollateralizationOracleWrapper-setCache-uint256-uint256-int256-"></span> `setCache(uint256 _cachedProtocolControlledValue, uint256 _cachedUserCirculatingFei, int256 _cachedProtocolEquity)` (external)

used in emergencies where the underlying oracle is compromised or failing

### <span id="CollateralizationOracleWrapper-update--"></span> `update()` (external)



### <span id="CollateralizationOracleWrapper-updateIfOutdated--"></span> `updateIfOutdated()` (external)



### <span id="CollateralizationOracleWrapper-_update--"></span> `_update() → bool` (internal)



### <span id="CollateralizationOracleWrapper-_setCache-uint256-uint256-int256-"></span> `_setCache(uint256 _cachedProtocolControlledValue, uint256 _cachedUserCirculatingFei, int256 _cachedProtocolEquity)` (internal)



### <span id="CollateralizationOracleWrapper-isOutdated--"></span> `isOutdated() → bool outdated` (public)



### <span id="CollateralizationOracleWrapper-read--"></span> `read() → struct Decimal.D256 collateralRatio, bool validityStatus` (external)



### <span id="CollateralizationOracleWrapper-isExceededDeviationThreshold--"></span> `isExceededDeviationThreshold() → bool obsolete` (public)



### <span id="CollateralizationOracleWrapper-_isExceededDeviationThreshold-uint256-uint256-"></span> `_isExceededDeviationThreshold(uint256 cached, uint256 current) → bool` (internal)



### <span id="CollateralizationOracleWrapper-isOutdatedOrExceededDeviationThreshold--"></span> `isOutdatedOrExceededDeviationThreshold() → bool` (external)



### <span id="CollateralizationOracleWrapper-pcvStats--"></span> `pcvStats() → uint256 protocolControlledValue, uint256 userCirculatingFei, int256 protocolEquity, bool validityStatus` (external)



### <span id="CollateralizationOracleWrapper-isOvercollateralized--"></span> `isOvercollateralized() → bool` (external)



### <span id="CollateralizationOracleWrapper-pcvStatsCurrent--"></span> `pcvStatsCurrent() → uint256 protocolControlledValue, uint256 userCirculatingFei, int256 protocolEquity, bool validityStatus` (external)



### <span id="CollateralizationOracleWrapper-_readNotPaused--"></span> `_readNotPaused() → bool` (internal)



