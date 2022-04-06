## <span id="ReserveStabilizer"></span> `ReserveStabilizer`



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
- [`constructor(address _core, address _oracle, address _backupOracle, contract IERC20 _token, uint256 _usdPerFeiBasisPoints)`][ReserveStabilizer-constructor-address-address-address-contract-IERC20-uint256-]
- [`exchangeFei(uint256 feiAmount)`][ReserveStabilizer-exchangeFei-uint256-]
- [`getAmountOut(uint256 amountFeiIn)`][ReserveStabilizer-getAmountOut-uint256-]
- [`withdraw(address to, uint256 amountOut)`][ReserveStabilizer-withdraw-address-uint256-]
- [`deposit()`][ReserveStabilizer-deposit--]
- [`balance()`][ReserveStabilizer-balance--]
- [`balanceReportedIn()`][ReserveStabilizer-balanceReportedIn--]
- [`setUsdPerFeiRate(uint256 newUsdPerFeiBasisPoints)`][ReserveStabilizer-setUsdPerFeiRate-uint256-]
- [`_transfer(address to, uint256 amount)`][ReserveStabilizer-_transfer-address-uint256-]
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
### <span id="ReserveStabilizer-constructor-address-address-address-contract-IERC20-uint256-"></span> `constructor(address _core, address _oracle, address _backupOracle, contract IERC20 _token, uint256 _usdPerFeiBasisPoints)` (public)



### <span id="ReserveStabilizer-exchangeFei-uint256-"></span> `exchangeFei(uint256 feiAmount) → uint256 amountOut` (public)



### <span id="ReserveStabilizer-getAmountOut-uint256-"></span> `getAmountOut(uint256 amountFeiIn) → uint256` (public)



### <span id="ReserveStabilizer-withdraw-address-uint256-"></span> `withdraw(address to, uint256 amountOut)` (external)



### <span id="ReserveStabilizer-deposit--"></span> `deposit()` (external)

no-op because the token transfer already happened

### <span id="ReserveStabilizer-balance--"></span> `balance() → uint256` (public)



### <span id="ReserveStabilizer-balanceReportedIn--"></span> `balanceReportedIn() → address` (public)



### <span id="ReserveStabilizer-setUsdPerFeiRate-uint256-"></span> `setUsdPerFeiRate(uint256 newUsdPerFeiBasisPoints)` (external)



### <span id="ReserveStabilizer-_transfer-address-uint256-"></span> `_transfer(address to, uint256 amount)` (internal)



