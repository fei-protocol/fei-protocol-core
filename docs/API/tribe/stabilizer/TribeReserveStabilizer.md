## <span id="TribeReserveStabilizer"></span> `TribeReserveStabilizer`



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
- [`constructor(address _core, address _tribeOracle, address _backupOracle, uint256 _usdPerFeiBasisPoints, contract ICollateralizationOracle _collateralizationOracle, uint256 _collateralizationThresholdBasisPoints, contract ITribeMinter _tribeMinter, uint256 _osmDuration)`][TribeReserveStabilizer-constructor-address-address-address-uint256-contract-ICollateralizationOracle-uint256-contract-ITribeMinter-uint256-]
- [`exchangeFei(uint256 feiAmount)`][TribeReserveStabilizer-exchangeFei-uint256-]
- [`withdraw(address, uint256)`][TribeReserveStabilizer-withdraw-address-uint256-]
- [`isCollateralizationBelowThreshold()`][TribeReserveStabilizer-isCollateralizationBelowThreshold--]
- [`startOracleDelayCountdown()`][TribeReserveStabilizer-startOracleDelayCountdown--]
- [`resetOracleDelayCountdown()`][TribeReserveStabilizer-resetOracleDelayCountdown--]
- [`setCollateralizationOracle(contract ICollateralizationOracle newCollateralizationOracle)`][TribeReserveStabilizer-setCollateralizationOracle-contract-ICollateralizationOracle-]
- [`setCollateralizationThreshold(uint256 newCollateralizationThresholdBasisPoints)`][TribeReserveStabilizer-setCollateralizationThreshold-uint256-]
- [`collateralizationThreshold()`][TribeReserveStabilizer-collateralizationThreshold--]
- [`_transfer(address to, uint256 amount)`][TribeReserveStabilizer-_transfer-address-uint256-]
- [`_pauseTimer()`][TribeReserveStabilizer-_pauseTimer--]
- [`isTimeEnded()`][Timed-isTimeEnded--]
- [`remainingTime()`][Timed-remainingTime--]
- [`timeSinceStart()`][Timed-timeSinceStart--]
- [`isTimeStarted()`][Timed-isTimeStarted--]
- [`_initTimed()`][Timed-_initTimed--]
- [`_setDuration(uint256 newDuration)`][Timed-_setDuration-uint256-]
- [`getAmountOut(uint256 amountFeiIn)`][ReserveStabilizer-getAmountOut-uint256-]
- [`deposit()`][ReserveStabilizer-deposit--]
- [`balance()`][ReserveStabilizer-balance--]
- [`balanceReportedIn()`][ReserveStabilizer-balanceReportedIn--]
- [`setUsdPerFeiRate(uint256 newUsdPerFeiBasisPoints)`][ReserveStabilizer-setUsdPerFeiRate-uint256-]
- [`withdrawERC20(address token, address to, uint256 amount)`][PCVDeposit-withdrawERC20-address-address-uint256-]
- [`_withdrawERC20(address token, address to, uint256 amount)`][PCVDeposit-_withdrawERC20-address-address-uint256-]
- [`withdrawETH(address payable to, uint256 amountOut)`][PCVDeposit-withdrawETH-address-payable-uint256-]
- [`resistantBalanceAndFei()`][PCVDeposit-resistantBalanceAndFei--]
- [`usdPerFeiBasisPoints()`][IReserveStabilizer-usdPerFeiBasisPoints--]
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
- [`collateralizationOracle()`][ITribeReserveStabilizer-collateralizationOracle--]
- [`DurationUpdate(uint256 oldDuration, uint256 newDuration)`][Timed-DurationUpdate-uint256-uint256-]
- [`TimerReset(uint256 startTime)`][Timed-TimerReset-uint256-]
- [`FeiExchange(address to, uint256 feiAmountIn, uint256 amountOut)`][IReserveStabilizer-FeiExchange-address-uint256-uint256-]
- [`UsdPerFeiRateUpdate(uint256 oldUsdPerFeiBasisPoints, uint256 newUsdPerFeiBasisPoints)`][IReserveStabilizer-UsdPerFeiRateUpdate-uint256-uint256-]
- [`Paused(address account)`][Pausable-Paused-address-]
- [`Unpaused(address account)`][Pausable-Unpaused-address-]
- [`CoreUpdate(address oldCore, address newCore)`][ICoreRef-CoreUpdate-address-address-]
- [`ContractAdminRoleUpdate(bytes32 oldContractAdminRole, bytes32 newContractAdminRole)`][ICoreRef-ContractAdminRoleUpdate-bytes32-bytes32-]
- [`Deposit(address _from, uint256 _amount)`][IPCVDeposit-Deposit-address-uint256-]
- [`Withdrawal(address _caller, address _to, uint256 _amount)`][IPCVDeposit-Withdrawal-address-address-uint256-]
- [`WithdrawERC20(address _caller, address _token, address _to, uint256 _amount)`][IPCVDeposit-WithdrawERC20-address-address-address-uint256-]
- [`WithdrawETH(address _caller, address _to, uint256 _amount)`][IPCVDeposit-WithdrawETH-address-address-uint256-]
- [`OracleUpdate(address oldOracle, address newOracle)`][IOracleRef-OracleUpdate-address-address-]
- [`InvertUpdate(bool oldDoInvert, bool newDoInvert)`][IOracleRef-InvertUpdate-bool-bool-]
- [`DecimalsNormalizerUpdate(int256 oldDecimalsNormalizer, int256 newDecimalsNormalizer)`][IOracleRef-DecimalsNormalizerUpdate-int256-int256-]
- [`BackupOracleUpdate(address oldBackupOracle, address newBackupOracle)`][IOracleRef-BackupOracleUpdate-address-address-]
- [`CollateralizationOracleUpdate(address oldCollateralizationOracle, address newCollateralizationOracle)`][ITribeReserveStabilizer-CollateralizationOracleUpdate-address-address-]
- [`CollateralizationThresholdUpdate(uint256 oldCollateralizationThresholdBasisPoints, uint256 newCollateralizationThresholdBasisPoints)`][ITribeReserveStabilizer-CollateralizationThresholdUpdate-uint256-uint256-]
### <span id="TribeReserveStabilizer-constructor-address-address-address-uint256-contract-ICollateralizationOracle-uint256-contract-ITribeMinter-uint256-"></span> `constructor(address _core, address _tribeOracle, address _backupOracle, uint256 _usdPerFeiBasisPoints, contract ICollateralizationOracle _collateralizationOracle, uint256 _collateralizationThresholdBasisPoints, contract ITribeMinter _tribeMinter, uint256 _osmDuration)` (public)



### <span id="TribeReserveStabilizer-exchangeFei-uint256-"></span> `exchangeFei(uint256 feiAmount) → uint256` (public)

the timer counts down from first time below threshold and opens after window

### <span id="TribeReserveStabilizer-withdraw-address-uint256-"></span> `withdraw(address, uint256)` (external)

reverts. Held TRIBE should only be released by exchangeFei or mint

### <span id="TribeReserveStabilizer-isCollateralizationBelowThreshold--"></span> `isCollateralizationBelowThreshold() → bool` (public)

returns false if the oracle is invalid

### <span id="TribeReserveStabilizer-startOracleDelayCountdown--"></span> `startOracleDelayCountdown()` (external)



### <span id="TribeReserveStabilizer-resetOracleDelayCountdown--"></span> `resetOracleDelayCountdown()` (external)



### <span id="TribeReserveStabilizer-setCollateralizationOracle-contract-ICollateralizationOracle-"></span> `setCollateralizationOracle(contract ICollateralizationOracle newCollateralizationOracle)` (external)



### <span id="TribeReserveStabilizer-setCollateralizationThreshold-uint256-"></span> `setCollateralizationThreshold(uint256 newCollateralizationThresholdBasisPoints)` (external)



### <span id="TribeReserveStabilizer-collateralizationThreshold--"></span> `collateralizationThreshold() → struct Decimal.D256` (external)



### <span id="TribeReserveStabilizer-_transfer-address-uint256-"></span> `_transfer(address to, uint256 amount)` (internal)



### <span id="TribeReserveStabilizer-_pauseTimer--"></span> `_pauseTimer()` (internal)



