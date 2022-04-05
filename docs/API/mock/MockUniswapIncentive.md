## <span id="MockUniswapIncentive"></span> `MockUniswapIncentive`



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
- [`constructor(address core)`][MockUniswapIncentive-constructor-address-]
- [`incentivize(address sender, address recipient, address, uint256)`][MockUniswapIncentive-incentivize-address-address-address-uint256-]
- [`isIncentiveParity()`][MockUniswapIncentive-isIncentiveParity--]
- [`setIncentiveParity(bool _isParity)`][MockUniswapIncentive-setIncentiveParity-bool-]
- [`isExemptAddress(address)`][MockUniswapIncentive-isExemptAddress-address-]
- [`setExempt(bool exempt)`][MockUniswapIncentive-setExempt-bool-]
- [`updateOracle()`][MockUniswapIncentive-updateOracle--]
- [`setExemptAddress(address account, bool _isExempt)`][MockUniswapIncentive-setExemptAddress-address-bool-]
- [`getBuyIncentive(uint256 amount)`][MockUniswapIncentive-getBuyIncentive-uint256-]
- [`getSellPenalty(uint256 amount)`][MockUniswapIncentive-getSellPenalty-uint256-]
- [`setIsMint(bool _isMint)`][MockIncentive-setIsMint-bool-]
- [`setIncentivizeRecipient(bool _incentivizeRecipient)`][MockIncentive-setIncentivizeRecipient-bool-]
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
### <span id="MockUniswapIncentive-constructor-address-"></span> `constructor(address core)` (public)



### <span id="MockUniswapIncentive-incentivize-address-address-address-uint256-"></span> `incentivize(address sender, address recipient, address, uint256)` (public)



### <span id="MockUniswapIncentive-isIncentiveParity--"></span> `isIncentiveParity() → bool` (external)



### <span id="MockUniswapIncentive-setIncentiveParity-bool-"></span> `setIncentiveParity(bool _isParity)` (public)



### <span id="MockUniswapIncentive-isExemptAddress-address-"></span> `isExemptAddress(address) → bool` (public)



### <span id="MockUniswapIncentive-setExempt-bool-"></span> `setExempt(bool exempt)` (public)



### <span id="MockUniswapIncentive-updateOracle--"></span> `updateOracle() → bool` (external)



### <span id="MockUniswapIncentive-setExemptAddress-address-bool-"></span> `setExemptAddress(address account, bool _isExempt)` (external)



### <span id="MockUniswapIncentive-getBuyIncentive-uint256-"></span> `getBuyIncentive(uint256 amount) → uint256, uint32 weight, struct Decimal.D256 initialDeviation, struct Decimal.D256 finalDeviation` (external)



### <span id="MockUniswapIncentive-getSellPenalty-uint256-"></span> `getSellPenalty(uint256 amount) → uint256, struct Decimal.D256 initialDeviation, struct Decimal.D256 finalDeviation` (external)



