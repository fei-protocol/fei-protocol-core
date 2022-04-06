## <span id="UniswapPCVDeposit"></span> `UniswapPCVDeposit`



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
- [`constructor(address _core, address _pair, address _router, address _oracle, address _backupOracle, uint256 _maxBasisPointsFromPegLP)`][UniswapPCVDeposit-constructor-address-address-address-address-address-uint256-]
- [`receive()`][UniswapPCVDeposit-receive--]
- [`deposit()`][UniswapPCVDeposit-deposit--]
- [`withdraw(address to, uint256 amountUnderlying)`][UniswapPCVDeposit-withdraw-address-uint256-]
- [`setMaxBasisPointsFromPegLP(uint256 _maxBasisPointsFromPegLP)`][UniswapPCVDeposit-setMaxBasisPointsFromPegLP-uint256-]
- [`setPair(address _pair)`][UniswapPCVDeposit-setPair-address-]
- [`balance()`][UniswapPCVDeposit-balance--]
- [`balanceReportedIn()`][UniswapPCVDeposit-balanceReportedIn--]
- [`resistantBalanceAndFei()`][UniswapPCVDeposit-resistantBalanceAndFei--]
- [`liquidityOwned()`][UniswapPCVDeposit-liquidityOwned--]
- [`_removeLiquidity(uint256 liquidity)`][UniswapPCVDeposit-_removeLiquidity-uint256-]
- [`_addLiquidity(uint256 tokenAmount, uint256 feiAmount)`][UniswapPCVDeposit-_addLiquidity-uint256-uint256-]
- [`_getMinLiquidity(uint256 amount)`][UniswapPCVDeposit-_getMinLiquidity-uint256-]
- [`_ratioOwned()`][UniswapPCVDeposit-_ratioOwned--]
- [`_approveToken(address _token)`][UniswapPCVDeposit-_approveToken-address-]
- [`_wrap()`][UniswapPCVDeposit-_wrap--]
- [`getReserves()`][UniRef-getReserves--]
- [`_setupPair(address newPair)`][UniRef-_setupPair-address-]
- [`_token()`][UniRef-_token--]
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
- [`withdrawERC20(address token, address to, uint256 amount)`][PCVDeposit-withdrawERC20-address-address-uint256-]
- [`_withdrawERC20(address token, address to, uint256 amount)`][PCVDeposit-_withdrawERC20-address-address-uint256-]
- [`withdrawETH(address payable to, uint256 amountOut)`][PCVDeposit-withdrawETH-address-payable-uint256-]
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
- [`pair()`][IUniRef-pair--]
- [`token()`][IUniRef-token--]
- [`router()`][IUniswapPCVDeposit-router--]
- [`maxBasisPointsFromPegLP()`][IUniswapPCVDeposit-maxBasisPointsFromPegLP--]
- [`Paused(address account)`][Pausable-Paused-address-]
- [`Unpaused(address account)`][Pausable-Unpaused-address-]
- [`CoreUpdate(address oldCore, address newCore)`][ICoreRef-CoreUpdate-address-address-]
- [`ContractAdminRoleUpdate(bytes32 oldContractAdminRole, bytes32 newContractAdminRole)`][ICoreRef-ContractAdminRoleUpdate-bytes32-bytes32-]
- [`OracleUpdate(address oldOracle, address newOracle)`][IOracleRef-OracleUpdate-address-address-]
- [`InvertUpdate(bool oldDoInvert, bool newDoInvert)`][IOracleRef-InvertUpdate-bool-bool-]
- [`DecimalsNormalizerUpdate(int256 oldDecimalsNormalizer, int256 newDecimalsNormalizer)`][IOracleRef-DecimalsNormalizerUpdate-int256-int256-]
- [`BackupOracleUpdate(address oldBackupOracle, address newBackupOracle)`][IOracleRef-BackupOracleUpdate-address-address-]
- [`PairUpdate(address oldPair, address newPair)`][IUniRef-PairUpdate-address-address-]
- [`Deposit(address _from, uint256 _amount)`][IPCVDeposit-Deposit-address-uint256-]
- [`Withdrawal(address _caller, address _to, uint256 _amount)`][IPCVDeposit-Withdrawal-address-address-uint256-]
- [`WithdrawERC20(address _caller, address _token, address _to, uint256 _amount)`][IPCVDeposit-WithdrawERC20-address-address-address-uint256-]
- [`WithdrawETH(address _caller, address _to, uint256 _amount)`][IPCVDeposit-WithdrawETH-address-address-uint256-]
- [`MaxBasisPointsFromPegLPUpdate(uint256 oldMaxBasisPointsFromPegLP, uint256 newMaxBasisPointsFromPegLP)`][IUniswapPCVDeposit-MaxBasisPointsFromPegLPUpdate-uint256-uint256-]
### <span id="UniswapPCVDeposit-constructor-address-address-address-address-address-uint256-"></span> `constructor(address _core, address _pair, address _router, address _oracle, address _backupOracle, uint256 _maxBasisPointsFromPegLP)` (public)



### <span id="UniswapPCVDeposit-receive--"></span> `receive()` (external)



### <span id="UniswapPCVDeposit-deposit--"></span> `deposit()` (external)



### <span id="UniswapPCVDeposit-withdraw-address-uint256-"></span> `withdraw(address to, uint256 amountUnderlying)` (external)

has rounding errors on amount to withdraw, can differ from the input "amountUnderlying"

### <span id="UniswapPCVDeposit-setMaxBasisPointsFromPegLP-uint256-"></span> `setMaxBasisPointsFromPegLP(uint256 _maxBasisPointsFromPegLP)` (public)



### <span id="UniswapPCVDeposit-setPair-address-"></span> `setPair(address _pair)` (public)

also approves the router for the new pair token and underlying token

### <span id="UniswapPCVDeposit-balance--"></span> `balance() → uint256` (public)



### <span id="UniswapPCVDeposit-balanceReportedIn--"></span> `balanceReportedIn() → address` (public)



### <span id="UniswapPCVDeposit-resistantBalanceAndFei--"></span> `resistantBalanceAndFei() → uint256, uint256` (public)



### <span id="UniswapPCVDeposit-liquidityOwned--"></span> `liquidityOwned() → uint256` (public)



### <span id="UniswapPCVDeposit-_removeLiquidity-uint256-"></span> `_removeLiquidity(uint256 liquidity) → uint256` (internal)



### <span id="UniswapPCVDeposit-_addLiquidity-uint256-uint256-"></span> `_addLiquidity(uint256 tokenAmount, uint256 feiAmount)` (internal)



### <span id="UniswapPCVDeposit-_getMinLiquidity-uint256-"></span> `_getMinLiquidity(uint256 amount) → uint256` (internal)



### <span id="UniswapPCVDeposit-_ratioOwned--"></span> `_ratioOwned() → struct Decimal.D256` (internal)



### <span id="UniswapPCVDeposit-_approveToken-address-"></span> `_approveToken(address _token)` (internal)



### <span id="UniswapPCVDeposit-_wrap--"></span> `_wrap()` (internal)



