## <span id="WeightedBalancerPoolManager"></span> `WeightedBalancerPoolManager`



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
- [`constructor()`][WeightedBalancerPoolManager-constructor--]
- [`setSwapEnabled(contract IWeightedPool pool, bool swapEnabled)`][WeightedBalancerPoolManager-setSwapEnabled-contract-IWeightedPool-bool-]
- [`updateWeightsGradually(contract IWeightedPool pool, uint256 startTime, uint256 endTime, uint256[] endWeights)`][WeightedBalancerPoolManager-updateWeightsGradually-contract-IWeightedPool-uint256-uint256-uint256---]
- [`_updateWeightsGradually(contract IWeightedPool pool, uint256 startTime, uint256 endTime, uint256[] endWeights)`][WeightedBalancerPoolManager-_updateWeightsGradually-contract-IWeightedPool-uint256-uint256-uint256---]
- [`withdrawCollectedManagementFees(contract IWeightedPool pool, address recipient)`][WeightedBalancerPoolManager-withdrawCollectedManagementFees-contract-IWeightedPool-address-]
- [`setSwapFee(contract IBasePool pool, uint256 swapFee)`][BaseBalancerPoolManager-setSwapFee-contract-IBasePool-uint256-]
- [`setPaused(contract IBasePool pool, bool paused)`][BaseBalancerPoolManager-setPaused-contract-IBasePool-bool-]
- [`setAssetManagerPoolConfig(contract IBasePool pool, contract IERC20 token, struct IAssetManager.PoolConfig poolConfig)`][BaseBalancerPoolManager-setAssetManagerPoolConfig-contract-IBasePool-contract-IERC20-struct-IAssetManager-PoolConfig-]
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
### <span id="WeightedBalancerPoolManager-constructor--"></span> `constructor()` (internal)



### <span id="WeightedBalancerPoolManager-setSwapEnabled-contract-IWeightedPool-bool-"></span> `setSwapEnabled(contract IWeightedPool pool, bool swapEnabled)` (public)



### <span id="WeightedBalancerPoolManager-updateWeightsGradually-contract-IWeightedPool-uint256-uint256-uint256---"></span> `updateWeightsGradually(contract IWeightedPool pool, uint256 startTime, uint256 endTime, uint256[] endWeights)` (public)



### <span id="WeightedBalancerPoolManager-_updateWeightsGradually-contract-IWeightedPool-uint256-uint256-uint256---"></span> `_updateWeightsGradually(contract IWeightedPool pool, uint256 startTime, uint256 endTime, uint256[] endWeights)` (internal)



### <span id="WeightedBalancerPoolManager-withdrawCollectedManagementFees-contract-IWeightedPool-address-"></span> `withdrawCollectedManagementFees(contract IWeightedPool pool, address recipient)` (public)



