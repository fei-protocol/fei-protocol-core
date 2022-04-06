## <span id="MockCollateralizationOracle"></span> `MockCollateralizationOracle`



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
- [`constructor(address core, uint256 exchangeRate)`][MockCollateralizationOracle-constructor-address-uint256-]
- [`set(uint256 _userCirculatingFei, uint256 _pcvValue)`][MockCollateralizationOracle-set-uint256-uint256-]
- [`isOvercollateralized()`][MockCollateralizationOracle-isOvercollateralized--]
- [`pcvEquityValue()`][MockCollateralizationOracle-pcvEquityValue--]
- [`pcvStats()`][MockCollateralizationOracle-pcvStats--]
- [`testMinter()`][MockCoreRef-testMinter--]
- [`testBurner()`][MockCoreRef-testBurner--]
- [`testPCVController()`][MockCoreRef-testPCVController--]
- [`testGovernor()`][MockCoreRef-testGovernor--]
- [`testGuardian()`][MockCoreRef-testGuardian--]
- [`testOnlyGovernorOrAdmin()`][MockCoreRef-testOnlyGovernorOrAdmin--]
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
- [`update()`][MockOracle-update--]
- [`read()`][MockOracle-read--]
- [`isOutdated()`][MockOracle-isOutdated--]
- [`setOutdated(bool _outdated)`][MockOracle-setOutdated-bool-]
- [`setValid(bool isValid)`][MockOracle-setValid-bool-]
- [`setExchangeRate(uint256 usdPerEth)`][MockOracle-setExchangeRate-uint256-]
- [`setExchangeRateScaledBase(uint256 usdPerEth)`][MockOracle-setExchangeRateScaledBase-uint256-]
- [`Paused(address account)`][Pausable-Paused-address-]
- [`Unpaused(address account)`][Pausable-Unpaused-address-]
- [`CoreUpdate(address oldCore, address newCore)`][ICoreRef-CoreUpdate-address-address-]
- [`ContractAdminRoleUpdate(bytes32 oldContractAdminRole, bytes32 newContractAdminRole)`][ICoreRef-ContractAdminRoleUpdate-bytes32-bytes32-]
- [`Update(uint256 _peg)`][IOracle-Update-uint256-]
### <span id="MockCollateralizationOracle-constructor-address-uint256-"></span> `constructor(address core, uint256 exchangeRate)` (public)



### <span id="MockCollateralizationOracle-set-uint256-uint256-"></span> `set(uint256 _userCirculatingFei, uint256 _pcvValue)` (public)



### <span id="MockCollateralizationOracle-isOvercollateralized--"></span> `isOvercollateralized() → bool` (public)



### <span id="MockCollateralizationOracle-pcvEquityValue--"></span> `pcvEquityValue() → int256` (public)



### <span id="MockCollateralizationOracle-pcvStats--"></span> `pcvStats() → uint256, uint256, int256, bool` (public)



