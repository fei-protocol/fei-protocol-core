## <span id="BalancerLBPSwapper"></span> `BalancerLBPSwapper`



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
- [`constructor(address _core, struct BalancerLBPSwapper.OracleData oracleData, uint256 _frequency, uint256 _weightSmall, uint256 _weightLarge, address _tokenSpent, address _tokenReceived, address _tokenReceivingAddress, uint256 _minTokenSpentBalance)`][BalancerLBPSwapper-constructor-address-struct-BalancerLBPSwapper-OracleData-uint256-uint256-uint256-address-address-address-uint256-]
- [`init(contract IWeightedPool _pool)`][BalancerLBPSwapper-init-contract-IWeightedPool-]
- [`swap()`][BalancerLBPSwapper-swap--]
- [`forceSwap()`][BalancerLBPSwapper-forceSwap--]
- [`exitPool(address to)`][BalancerLBPSwapper-exitPool-address-]
- [`withdrawERC20(address token, address to, uint256 amount)`][BalancerLBPSwapper-withdrawERC20-address-address-uint256-]
- [`swapEndTime()`][BalancerLBPSwapper-swapEndTime--]
- [`setSwapFrequency(uint256 _frequency)`][BalancerLBPSwapper-setSwapFrequency-uint256-]
- [`setMinTokenSpent(uint256 newMinTokenSpentBalance)`][BalancerLBPSwapper-setMinTokenSpent-uint256-]
- [`setReceivingAddress(address newTokenReceivingAddress)`][BalancerLBPSwapper-setReceivingAddress-address-]
- [`getTokensIn(uint256 spentTokenBalance)`][BalancerLBPSwapper-getTokensIn-uint256-]
- [`_swap()`][BalancerLBPSwapper-_swap--]
- [`_exitPool()`][BalancerLBPSwapper-_exitPool--]
- [`_transferAll(address token, address to)`][BalancerLBPSwapper-_transferAll-address-address-]
- [`_setReceivingAddress(address newTokenReceivingAddress)`][BalancerLBPSwapper-_setReceivingAddress-address-]
- [`_initializePool()`][BalancerLBPSwapper-_initializePool--]
- [`_getTokensIn(uint256 spentTokenBalance)`][BalancerLBPSwapper-_getTokensIn-uint256-]
- [`_setMinTokenSpent(uint256 newMinTokenSpentBalance)`][BalancerLBPSwapper-_setMinTokenSpent-uint256-]
- [`setSwapEnabled(contract IWeightedPool pool, bool swapEnabled)`][WeightedBalancerPoolManager-setSwapEnabled-contract-IWeightedPool-bool-]
- [`updateWeightsGradually(contract IWeightedPool pool, uint256 startTime, uint256 endTime, uint256[] endWeights)`][WeightedBalancerPoolManager-updateWeightsGradually-contract-IWeightedPool-uint256-uint256-uint256---]
- [`_updateWeightsGradually(contract IWeightedPool pool, uint256 startTime, uint256 endTime, uint256[] endWeights)`][WeightedBalancerPoolManager-_updateWeightsGradually-contract-IWeightedPool-uint256-uint256-uint256---]
- [`withdrawCollectedManagementFees(contract IWeightedPool pool, address recipient)`][WeightedBalancerPoolManager-withdrawCollectedManagementFees-contract-IWeightedPool-address-]
- [`setSwapFee(contract IBasePool pool, uint256 swapFee)`][BaseBalancerPoolManager-setSwapFee-contract-IBasePool-uint256-]
- [`setPaused(contract IBasePool pool, bool paused)`][BaseBalancerPoolManager-setPaused-contract-IBasePool-bool-]
- [`setAssetManagerPoolConfig(contract IBasePool pool, contract IERC20 token, struct IAssetManager.PoolConfig poolConfig)`][BaseBalancerPoolManager-setAssetManagerPoolConfig-contract-IBasePool-contract-IERC20-struct-IAssetManager-PoolConfig-]
- [`isTimeEnded()`][Timed-isTimeEnded--]
- [`remainingTime()`][Timed-remainingTime--]
- [`timeSinceStart()`][Timed-timeSinceStart--]
- [`isTimeStarted()`][Timed-isTimeStarted--]
- [`_initTimed()`][Timed-_initTimed--]
- [`_setDuration(uint256 newDuration)`][Timed-_setDuration-uint256-]
- [`setOracle(address newOracle)`][OracleRef-setOracle-address-]
- [`setDoInvert(bool newDoInvert)`][OracleRef-setDoInvert-bool-]
- [`setDecimalsNormalizer(int256 newDecimalsNormalizer)`][OracleRef-setDecimalsNormalizer-int256-]
- [`setBackupOracle(address newBackupOracle)`][OracleRef-setBackupOracle-address-]
- [`invert(struct Decimal.D256 price)`][OracleRef-invert-struct-Decimal-D256-]
- [`updateOracle()`][OracleRef-updateOracle--]
- [`readOracle()`][OracleRef-readOracle--]
- [`_setOracle(address newOracle)`][OracleRef-_setOracle-address-]
- [`_setBackupOracle(address newBackupOracle)`][OracleRef-_setBackupOracle-address-]
- [`_setDoInvert(bool newDoInvert)`][OracleRef-_setDoInvert-bool-]
- [`_setDecimalsNormalizer(int256 newDecimalsNormalizer)`][OracleRef-_setDecimalsNormalizer-int256-]
- [`_setDecimalsNormalizerFromToken(address token)`][OracleRef-_setDecimalsNormalizerFromToken-address-]
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
- [`oracle()`][IOracleRef-oracle--]
- [`backupOracle()`][IOracleRef-backupOracle--]
- [`doInvert()`][IOracleRef-doInvert--]
- [`decimalsNormalizer()`][IOracleRef-decimalsNormalizer--]
- [`tokenSpent()`][IPCVSwapper-tokenSpent--]
- [`tokenReceived()`][IPCVSwapper-tokenReceived--]
- [`tokenReceivingAddress()`][IPCVSwapper-tokenReceivingAddress--]
- [`WithdrawERC20(address _caller, address _token, address _to, uint256 _amount)`][BalancerLBPSwapper-WithdrawERC20-address-address-address-uint256-]
- [`ExitPool()`][BalancerLBPSwapper-ExitPool--]
- [`MinTokenSpentUpdate(uint256 oldMinTokenSpentBalance, uint256 newMinTokenSpentBalance)`][BalancerLBPSwapper-MinTokenSpentUpdate-uint256-uint256-]
- [`DurationUpdate(uint256 oldDuration, uint256 newDuration)`][Timed-DurationUpdate-uint256-uint256-]
- [`TimerReset(uint256 startTime)`][Timed-TimerReset-uint256-]
- [`Paused(address account)`][Pausable-Paused-address-]
- [`Unpaused(address account)`][Pausable-Unpaused-address-]
- [`CoreUpdate(address oldCore, address newCore)`][ICoreRef-CoreUpdate-address-address-]
- [`ContractAdminRoleUpdate(bytes32 oldContractAdminRole, bytes32 newContractAdminRole)`][ICoreRef-ContractAdminRoleUpdate-bytes32-bytes32-]
- [`OracleUpdate(address oldOracle, address newOracle)`][IOracleRef-OracleUpdate-address-address-]
- [`InvertUpdate(bool oldDoInvert, bool newDoInvert)`][IOracleRef-InvertUpdate-bool-bool-]
- [`DecimalsNormalizerUpdate(int256 oldDecimalsNormalizer, int256 newDecimalsNormalizer)`][IOracleRef-DecimalsNormalizerUpdate-int256-int256-]
- [`BackupOracleUpdate(address oldBackupOracle, address newBackupOracle)`][IOracleRef-BackupOracleUpdate-address-address-]
- [`UpdateReceivingAddress(address oldTokenReceivingAddress, address newTokenReceivingAddress)`][IPCVSwapper-UpdateReceivingAddress-address-address-]
- [`Swap(address _caller, address _tokenSpent, address _tokenReceived, uint256 _amountSpent, uint256 _amountReceived)`][IPCVSwapper-Swap-address-address-address-uint256-uint256-]
### <span id="BalancerLBPSwapper-constructor-address-struct-BalancerLBPSwapper-OracleData-uint256-uint256-uint256-address-address-address-uint256-"></span> `constructor(address _core, struct BalancerLBPSwapper.OracleData oracleData, uint256 _frequency, uint256 _weightSmall, uint256 _weightLarge, address _tokenSpent, address _tokenReceived, address _tokenReceivingAddress, uint256 _minTokenSpentBalance)` (public)



### <span id="BalancerLBPSwapper-init-contract-IWeightedPool-"></span> `init(contract IWeightedPool _pool)` (external)



### <span id="BalancerLBPSwapper-swap--"></span> `swap()` (external)



### <span id="BalancerLBPSwapper-forceSwap--"></span> `forceSwap()` (external)



### <span id="BalancerLBPSwapper-exitPool-address-"></span> `exitPool(address to)` (external)



### <span id="BalancerLBPSwapper-withdrawERC20-address-address-uint256-"></span> `withdrawERC20(address token, address to, uint256 amount)` (public)



### <span id="BalancerLBPSwapper-swapEndTime--"></span> `swapEndTime() → uint256 endTime` (public)



### <span id="BalancerLBPSwapper-setSwapFrequency-uint256-"></span> `setSwapFrequency(uint256 _frequency)` (external)



### <span id="BalancerLBPSwapper-setMinTokenSpent-uint256-"></span> `setMinTokenSpent(uint256 newMinTokenSpentBalance)` (external)



### <span id="BalancerLBPSwapper-setReceivingAddress-address-"></span> `setReceivingAddress(address newTokenReceivingAddress)` (external)



### <span id="BalancerLBPSwapper-getTokensIn-uint256-"></span> `getTokensIn(uint256 spentTokenBalance) → address[] tokens, uint256[] amountsIn` (external)



### <span id="BalancerLBPSwapper-_swap--"></span> `_swap()` (internal)



### <span id="BalancerLBPSwapper-_exitPool--"></span> `_exitPool()` (internal)



### <span id="BalancerLBPSwapper-_transferAll-address-address-"></span> `_transferAll(address token, address to)` (internal)



### <span id="BalancerLBPSwapper-_setReceivingAddress-address-"></span> `_setReceivingAddress(address newTokenReceivingAddress)` (internal)



### <span id="BalancerLBPSwapper-_initializePool--"></span> `_initializePool()` (internal)



### <span id="BalancerLBPSwapper-_getTokensIn-uint256-"></span> `_getTokensIn(uint256 spentTokenBalance) → uint256[] amountsIn` (internal)



### <span id="BalancerLBPSwapper-_setMinTokenSpent-uint256-"></span> `_setMinTokenSpent(uint256 newMinTokenSpentBalance)` (internal)



### <span id="BalancerLBPSwapper-WithdrawERC20-address-address-address-uint256-"></span> `WithdrawERC20(address _caller, address _token, address _to, uint256 _amount)`



### <span id="BalancerLBPSwapper-ExitPool--"></span> `ExitPool()`



### <span id="BalancerLBPSwapper-MinTokenSpentUpdate-uint256-uint256-"></span> `MinTokenSpentUpdate(uint256 oldMinTokenSpentBalance, uint256 newMinTokenSpentBalance)`



