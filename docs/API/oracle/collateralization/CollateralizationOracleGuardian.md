## <span id="CollateralizationOracleGuardian"></span> `CollateralizationOracleGuardian`



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
- [`constructor(address _core, contract ICollateralizationOracleWrapper _oracleWrapper, uint256 _frequency, uint256 _deviationThresholdBasisPoints)`][CollateralizationOracleGuardian-constructor-address-contract-ICollateralizationOracleWrapper-uint256-uint256-]
- [`setCache(uint256 protocolControlledValue, uint256 userCirculatingFei)`][CollateralizationOracleGuardian-setCache-uint256-uint256-]
- [`calculateDeviationThresholdBasisPoints(uint256 a, uint256 b)`][CollateralizationOracleGuardian-calculateDeviationThresholdBasisPoints-uint256-uint256-]
- [`setDeviationThresholdBasisPoints(uint256 newDeviationThresholdBasisPoints)`][CollateralizationOracleGuardian-setDeviationThresholdBasisPoints-uint256-]
- [`_setDeviationThresholdBasisPoints(uint256 newDeviationThresholdBasisPoints)`][CollateralizationOracleGuardian-_setDeviationThresholdBasisPoints-uint256-]
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
- [`_mintFei(address to, uint256 amount)`][CoreRef-_mintFei-address-uint256-]
- [`_setContractAdminRole(bytes32 newContractAdminRole)`][CoreRef-_setContractAdminRole-bytes32-]
- [`paused()`][Pausable-paused--]
- [`_pause()`][Pausable-_pause--]
- [`_unpause()`][Pausable-_unpause--]
- [`_msgSender()`][Context-_msgSender--]
- [`_msgData()`][Context-_msgData--]
- [`CONTRACT_ADMIN_ROLE()`][ICoreRef-CONTRACT_ADMIN_ROLE--]
- [`DeviationThresholdUpdate(uint256 oldDeviationThresholdBasisPoints, uint256 newDeviationThresholdBasisPoints)`][CollateralizationOracleGuardian-DeviationThresholdUpdate-uint256-uint256-]
- [`DurationUpdate(uint256 oldDuration, uint256 newDuration)`][Timed-DurationUpdate-uint256-uint256-]
- [`TimerReset(uint256 startTime)`][Timed-TimerReset-uint256-]
- [`Paused(address account)`][Pausable-Paused-address-]
- [`Unpaused(address account)`][Pausable-Unpaused-address-]
- [`CoreUpdate(address oldCore, address newCore)`][ICoreRef-CoreUpdate-address-address-]
- [`ContractAdminRoleUpdate(bytes32 oldContractAdminRole, bytes32 newContractAdminRole)`][ICoreRef-ContractAdminRoleUpdate-bytes32-bytes32-]
### <span id="CollateralizationOracleGuardian-constructor-address-contract-ICollateralizationOracleWrapper-uint256-uint256-"></span> `constructor(address _core, contract ICollateralizationOracleWrapper _oracleWrapper, uint256 _frequency, uint256 _deviationThresholdBasisPoints)` (public)



### <span id="CollateralizationOracleGuardian-setCache-uint256-uint256-"></span> `setCache(uint256 protocolControlledValue, uint256 userCirculatingFei)` (external)

make sure to pause the CR oracle wrapper or else the set value would be overwritten on next update

### <span id="CollateralizationOracleGuardian-calculateDeviationThresholdBasisPoints-uint256-uint256-"></span> `calculateDeviationThresholdBasisPoints(uint256 a, uint256 b) → uint256` (public)



### <span id="CollateralizationOracleGuardian-setDeviationThresholdBasisPoints-uint256-"></span> `setDeviationThresholdBasisPoints(uint256 newDeviationThresholdBasisPoints)` (external)



### <span id="CollateralizationOracleGuardian-_setDeviationThresholdBasisPoints-uint256-"></span> `_setDeviationThresholdBasisPoints(uint256 newDeviationThresholdBasisPoints)` (internal)



### <span id="CollateralizationOracleGuardian-DeviationThresholdUpdate-uint256-uint256-"></span> `DeviationThresholdUpdate(uint256 oldDeviationThresholdBasisPoints, uint256 newDeviationThresholdBasisPoints)`



