## <span id="AngleUniswapPCVDeposit"></span> `AngleUniswapPCVDeposit`



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
- [`constructor(address _core, address _pair, address _router, address _oracle, address _backupOracle, uint256 _maxBasisPointsFromPegLP, contract IStableMaster _stableMaster, contract IPoolManager _poolManager, contract IStakingRewards _stakingRewards)`][AngleUniswapPCVDeposit-constructor-address-address-address-address-address-uint256-contract-IStableMaster-contract-IPoolManager-contract-IStakingRewards-]
- [`claimRewards()`][AngleUniswapPCVDeposit-claimRewards--]
- [`mintAgToken(uint256 amountFei)`][AngleUniswapPCVDeposit-mintAgToken-uint256-]
- [`burnAgToken(uint256 amountAgToken)`][AngleUniswapPCVDeposit-burnAgToken-uint256-]
- [`burnAgTokenAll()`][AngleUniswapPCVDeposit-burnAgTokenAll--]
- [`setPair(address _pair)`][AngleUniswapPCVDeposit-setPair-address-]
- [`setStakingRewards(contract IStakingRewards _stakingRewards)`][AngleUniswapPCVDeposit-setStakingRewards-contract-IStakingRewards-]
- [`setPoolManager(contract IPoolManager _poolManager)`][AngleUniswapPCVDeposit-setPoolManager-contract-IPoolManager-]
- [`liquidityOwned()`][AngleUniswapPCVDeposit-liquidityOwned--]
- [`_removeLiquidity(uint256 liquidity)`][AngleUniswapPCVDeposit-_removeLiquidity-uint256-]
- [`_addLiquidity(uint256 tokenAmount, uint256 feiAmount)`][AngleUniswapPCVDeposit-_addLiquidity-uint256-uint256-]
- [`receive()`][UniswapPCVDeposit-receive--]
- [`deposit()`][UniswapPCVDeposit-deposit--]
- [`withdraw(address to, uint256 amountUnderlying)`][UniswapPCVDeposit-withdraw-address-uint256-]
- [`setMaxBasisPointsFromPegLP(uint256 _maxBasisPointsFromPegLP)`][UniswapPCVDeposit-setMaxBasisPointsFromPegLP-uint256-]
- [`balance()`][UniswapPCVDeposit-balance--]
- [`balanceReportedIn()`][UniswapPCVDeposit-balanceReportedIn--]
- [`resistantBalanceAndFei()`][UniswapPCVDeposit-resistantBalanceAndFei--]
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
### <span id="AngleUniswapPCVDeposit-constructor-address-address-address-address-address-uint256-contract-IStableMaster-contract-IPoolManager-contract-IStakingRewards-"></span> `constructor(address _core, address _pair, address _router, address _oracle, address _backupOracle, uint256 _maxBasisPointsFromPegLP, contract IStableMaster _stableMaster, contract IPoolManager _poolManager, contract IStakingRewards _stakingRewards)` (public)



### <span id="AngleUniswapPCVDeposit-claimRewards--"></span> `claimRewards()` (external)



### <span id="AngleUniswapPCVDeposit-mintAgToken-uint256-"></span> `mintAgToken(uint256 amountFei)` (public)

the call will revert if slippage is too high compared to oracle.

### <span id="AngleUniswapPCVDeposit-burnAgToken-uint256-"></span> `burnAgToken(uint256 amountAgToken)` (public)

the call will revert if slippage is too high compared to oracle

### <span id="AngleUniswapPCVDeposit-burnAgTokenAll--"></span> `burnAgTokenAll()` (external)

see burnAgToken(uint256 amount).

### <span id="AngleUniswapPCVDeposit-setPair-address-"></span> `setPair(address _pair)` (public)

also approves the router for the new pair token and underlying token

### <span id="AngleUniswapPCVDeposit-setStakingRewards-contract-IStakingRewards-"></span> `setStakingRewards(contract IStakingRewards _stakingRewards)` (public)



### <span id="AngleUniswapPCVDeposit-setPoolManager-contract-IPoolManager-"></span> `setPoolManager(contract IPoolManager _poolManager)` (public)



### <span id="AngleUniswapPCVDeposit-liquidityOwned--"></span> `liquidityOwned() → uint256` (public)



### <span id="AngleUniswapPCVDeposit-_removeLiquidity-uint256-"></span> `_removeLiquidity(uint256 liquidity) → uint256` (internal)



### <span id="AngleUniswapPCVDeposit-_addLiquidity-uint256-uint256-"></span> `_addLiquidity(uint256 tokenAmount, uint256 feiAmount)` (internal)



