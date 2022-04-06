## <span id="LiquidityGaugeManager"></span> `LiquidityGaugeManager`



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
- [`constructor(address _gaugeController)`][LiquidityGaugeManager-constructor-address-]
- [`setGaugeController(address _gaugeController)`][LiquidityGaugeManager-setGaugeController-address-]
- [`setTokenToGauge(address token, address gaugeAddress)`][LiquidityGaugeManager-setTokenToGauge-address-address-]
- [`voteForGaugeWeight(address token, uint256 gaugeWeight)`][LiquidityGaugeManager-voteForGaugeWeight-address-uint256-]
- [`stakeInGauge(address token, uint256 amount)`][LiquidityGaugeManager-stakeInGauge-address-uint256-]
- [`stakeAllInGauge(address token)`][LiquidityGaugeManager-stakeAllInGauge-address-]
- [`unstakeFromGauge(address token, uint256 amount)`][LiquidityGaugeManager-unstakeFromGauge-address-uint256-]
- [`claimGaugeRewards(address gaugeAddress)`][LiquidityGaugeManager-claimGaugeRewards-address-]
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
- [`GaugeControllerChanged(address oldController, address newController)`][LiquidityGaugeManager-GaugeControllerChanged-address-address-]
- [`GaugeSetForToken(address token, address gauge)`][LiquidityGaugeManager-GaugeSetForToken-address-address-]
- [`GaugeVote(address gauge, uint256 amount)`][LiquidityGaugeManager-GaugeVote-address-uint256-]
- [`GaugeStake(address gauge, uint256 amount)`][LiquidityGaugeManager-GaugeStake-address-uint256-]
- [`GaugeUnstake(address gauge, uint256 amount)`][LiquidityGaugeManager-GaugeUnstake-address-uint256-]
- [`GaugeRewardsClaimed(address gauge, address token, uint256 amount)`][LiquidityGaugeManager-GaugeRewardsClaimed-address-address-uint256-]
- [`Paused(address account)`][Pausable-Paused-address-]
- [`Unpaused(address account)`][Pausable-Unpaused-address-]
- [`CoreUpdate(address oldCore, address newCore)`][ICoreRef-CoreUpdate-address-address-]
- [`ContractAdminRoleUpdate(bytes32 oldContractAdminRole, bytes32 newContractAdminRole)`][ICoreRef-ContractAdminRoleUpdate-bytes32-bytes32-]
### <span id="LiquidityGaugeManager-constructor-address-"></span> `constructor(address _gaugeController)` (internal)



### <span id="LiquidityGaugeManager-setGaugeController-address-"></span> `setGaugeController(address _gaugeController)` (public)



### <span id="LiquidityGaugeManager-setTokenToGauge-address-address-"></span> `setTokenToGauge(address token, address gaugeAddress)` (public)



### <span id="LiquidityGaugeManager-voteForGaugeWeight-address-uint256-"></span> `voteForGaugeWeight(address token, uint256 gaugeWeight)` (public)



### <span id="LiquidityGaugeManager-stakeInGauge-address-uint256-"></span> `stakeInGauge(address token, uint256 amount)` (public)



### <span id="LiquidityGaugeManager-stakeAllInGauge-address-"></span> `stakeAllInGauge(address token)` (public)



### <span id="LiquidityGaugeManager-unstakeFromGauge-address-uint256-"></span> `unstakeFromGauge(address token, uint256 amount)` (public)



### <span id="LiquidityGaugeManager-claimGaugeRewards-address-"></span> `claimGaugeRewards(address gaugeAddress)` (public)



### <span id="LiquidityGaugeManager-GaugeControllerChanged-address-address-"></span> `GaugeControllerChanged(address oldController, address newController)`



### <span id="LiquidityGaugeManager-GaugeSetForToken-address-address-"></span> `GaugeSetForToken(address token, address gauge)`



### <span id="LiquidityGaugeManager-GaugeVote-address-uint256-"></span> `GaugeVote(address gauge, uint256 amount)`



### <span id="LiquidityGaugeManager-GaugeStake-address-uint256-"></span> `GaugeStake(address gauge, uint256 amount)`



### <span id="LiquidityGaugeManager-GaugeUnstake-address-uint256-"></span> `GaugeUnstake(address gauge, uint256 amount)`



### <span id="LiquidityGaugeManager-GaugeRewardsClaimed-address-address-uint256-"></span> `GaugeRewardsClaimed(address gauge, address token, uint256 amount)`



