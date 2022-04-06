## <span id="CollateralizationOracle"></span> `CollateralizationOracle`



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
- [`constructor(address _core, address[] _deposits, address[] _tokens, address[] _oracles)`][CollateralizationOracle-constructor-address-address---address---address---]
- [`isTokenInPcv(address token)`][CollateralizationOracle-isTokenInPcv-address-]
- [`getTokensInPcv()`][CollateralizationOracle-getTokensInPcv--]
- [`getTokenInPcv(uint256 i)`][CollateralizationOracle-getTokenInPcv-uint256-]
- [`getDepositsForToken(address _token)`][CollateralizationOracle-getDepositsForToken-address-]
- [`getDepositForToken(address token, uint256 i)`][CollateralizationOracle-getDepositForToken-address-uint256-]
- [`addDeposit(address _deposit)`][CollateralizationOracle-addDeposit-address-]
- [`addDeposits(address[] _deposits)`][CollateralizationOracle-addDeposits-address---]
- [`_addDeposits(address[] _deposits)`][CollateralizationOracle-_addDeposits-address---]
- [`_addDeposit(address _deposit)`][CollateralizationOracle-_addDeposit-address-]
- [`removeDeposit(address _deposit)`][CollateralizationOracle-removeDeposit-address-]
- [`removeDeposits(address[] _deposits)`][CollateralizationOracle-removeDeposits-address---]
- [`_removeDeposit(address _deposit)`][CollateralizationOracle-_removeDeposit-address-]
- [`swapDeposit(address _oldDeposit, address _newDeposit)`][CollateralizationOracle-swapDeposit-address-address-]
- [`setOracle(address _token, address _newOracle)`][CollateralizationOracle-setOracle-address-address-]
- [`setOracles(address[] _tokens, address[] _oracles)`][CollateralizationOracle-setOracles-address---address---]
- [`_setOracles(address[] _tokens, address[] _oracles)`][CollateralizationOracle-_setOracles-address---address---]
- [`_setOracle(address _token, address _newOracle)`][CollateralizationOracle-_setOracle-address-address-]
- [`update()`][CollateralizationOracle-update--]
- [`isOutdated()`][CollateralizationOracle-isOutdated--]
- [`read()`][CollateralizationOracle-read--]
- [`pcvStats()`][CollateralizationOracle-pcvStats--]
- [`isOvercollateralized()`][CollateralizationOracle-isOvercollateralized--]
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
- [`DepositAdd(address from, address deposit, address token)`][CollateralizationOracle-DepositAdd-address-address-address-]
- [`DepositRemove(address from, address deposit)`][CollateralizationOracle-DepositRemove-address-address-]
- [`OracleUpdate(address from, address token, address oldOracle, address newOracle)`][CollateralizationOracle-OracleUpdate-address-address-address-address-]
- [`Paused(address account)`][Pausable-Paused-address-]
- [`Unpaused(address account)`][Pausable-Unpaused-address-]
- [`CoreUpdate(address oldCore, address newCore)`][ICoreRef-CoreUpdate-address-address-]
- [`ContractAdminRoleUpdate(bytes32 oldContractAdminRole, bytes32 newContractAdminRole)`][ICoreRef-ContractAdminRoleUpdate-bytes32-bytes32-]
- [`Update(uint256 _peg)`][IOracle-Update-uint256-]
### <span id="CollateralizationOracle-constructor-address-address---address---address---"></span> `constructor(address _core, address[] _deposits, address[] _tokens, address[] _oracles)` (public)



### <span id="CollateralizationOracle-isTokenInPcv-address-"></span> `isTokenInPcv(address token) → bool` (external)



### <span id="CollateralizationOracle-getTokensInPcv--"></span> `getTokensInPcv() → address[]` (external)



### <span id="CollateralizationOracle-getTokenInPcv-uint256-"></span> `getTokenInPcv(uint256 i) → address` (external)



### <span id="CollateralizationOracle-getDepositsForToken-address-"></span> `getDepositsForToken(address _token) → address[]` (external)



### <span id="CollateralizationOracle-getDepositForToken-address-uint256-"></span> `getDepositForToken(address token, uint256 i) → address` (external)



### <span id="CollateralizationOracle-addDeposit-address-"></span> `addDeposit(address _deposit)` (external)



### <span id="CollateralizationOracle-addDeposits-address---"></span> `addDeposits(address[] _deposits)` (external)



### <span id="CollateralizationOracle-_addDeposits-address---"></span> `_addDeposits(address[] _deposits)` (internal)



### <span id="CollateralizationOracle-_addDeposit-address-"></span> `_addDeposit(address _deposit)` (internal)



### <span id="CollateralizationOracle-removeDeposit-address-"></span> `removeDeposit(address _deposit)` (external)



### <span id="CollateralizationOracle-removeDeposits-address---"></span> `removeDeposits(address[] _deposits)` (external)



### <span id="CollateralizationOracle-_removeDeposit-address-"></span> `_removeDeposit(address _deposit)` (internal)



### <span id="CollateralizationOracle-swapDeposit-address-address-"></span> `swapDeposit(address _oldDeposit, address _newDeposit)` (external)



### <span id="CollateralizationOracle-setOracle-address-address-"></span> `setOracle(address _token, address _newOracle)` (external)



### <span id="CollateralizationOracle-setOracles-address---address---"></span> `setOracles(address[] _tokens, address[] _oracles)` (public)



### <span id="CollateralizationOracle-_setOracles-address---address---"></span> `_setOracles(address[] _tokens, address[] _oracles)` (internal)



### <span id="CollateralizationOracle-_setOracle-address-address-"></span> `_setOracle(address _token, address _newOracle)` (internal)



### <span id="CollateralizationOracle-update--"></span> `update()` (external)



### <span id="CollateralizationOracle-isOutdated--"></span> `isOutdated() → bool` (external)



### <span id="CollateralizationOracle-read--"></span> `read() → struct Decimal.D256 collateralRatio, bool validityStatus` (public)



### <span id="CollateralizationOracle-pcvStats--"></span> `pcvStats() → uint256 protocolControlledValue, uint256 userCirculatingFei, int256 protocolEquity, bool validityStatus` (public)



### <span id="CollateralizationOracle-isOvercollateralized--"></span> `isOvercollateralized() → bool` (external)



### <span id="CollateralizationOracle-DepositAdd-address-address-address-"></span> `DepositAdd(address from, address deposit, address token)`



### <span id="CollateralizationOracle-DepositRemove-address-address-"></span> `DepositRemove(address from, address deposit)`



### <span id="CollateralizationOracle-OracleUpdate-address-address-address-address-"></span> `OracleUpdate(address from, address token, address oldOracle, address newOracle)`



