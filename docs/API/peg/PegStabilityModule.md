## <span id="PegStabilityModule"></span> `PegStabilityModule`



- [`whileRedemptionsNotPaused()`][PegStabilityModule-whileRedemptionsNotPaused--]
- [`whileMintingNotPaused()`][PegStabilityModule-whileMintingNotPaused--]
- [`nonReentrant()`][ReentrancyGuard-nonReentrant--]
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
- [`constructor(struct PegStabilityModule.OracleParams params, uint256 _mintFeeBasisPoints, uint256 _redeemFeeBasisPoints, uint256 _reservesThreshold, uint256 _feiLimitPerSecond, uint256 _mintingBufferCap, contract IERC20 _underlyingToken, contract IPCVDeposit _surplusTarget)`][PegStabilityModule-constructor-struct-PegStabilityModule-OracleParams-uint256-uint256-uint256-uint256-uint256-contract-IERC20-contract-IPCVDeposit-]
- [`pauseRedeem()`][PegStabilityModule-pauseRedeem--]
- [`unpauseRedeem()`][PegStabilityModule-unpauseRedeem--]
- [`pauseMint()`][PegStabilityModule-pauseMint--]
- [`unpauseMint()`][PegStabilityModule-unpauseMint--]
- [`withdraw(address to, uint256 amount)`][PegStabilityModule-withdraw-address-uint256-]
- [`setMintFee(uint256 newMintFeeBasisPoints)`][PegStabilityModule-setMintFee-uint256-]
- [`setRedeemFee(uint256 newRedeemFeeBasisPoints)`][PegStabilityModule-setRedeemFee-uint256-]
- [`setReservesThreshold(uint256 newReservesThreshold)`][PegStabilityModule-setReservesThreshold-uint256-]
- [`setSurplusTarget(contract IPCVDeposit newTarget)`][PegStabilityModule-setSurplusTarget-contract-IPCVDeposit-]
- [`_setMintFee(uint256 newMintFeeBasisPoints)`][PegStabilityModule-_setMintFee-uint256-]
- [`_setRedeemFee(uint256 newRedeemFeeBasisPoints)`][PegStabilityModule-_setRedeemFee-uint256-]
- [`_setReservesThreshold(uint256 newReservesThreshold)`][PegStabilityModule-_setReservesThreshold-uint256-]
- [`_setSurplusTarget(contract IPCVDeposit newSurplusTarget)`][PegStabilityModule-_setSurplusTarget-contract-IPCVDeposit-]
- [`allocateSurplus()`][PegStabilityModule-allocateSurplus--]
- [`deposit()`][PegStabilityModule-deposit--]
- [`_redeem(address to, uint256 amountFeiIn, uint256 minAmountOut)`][PegStabilityModule-_redeem-address-uint256-uint256-]
- [`_mint(address to, uint256 amountIn, uint256 minAmountOut)`][PegStabilityModule-_mint-address-uint256-uint256-]
- [`redeem(address to, uint256 amountFeiIn, uint256 minAmountOut)`][PegStabilityModule-redeem-address-uint256-uint256-]
- [`mint(address to, uint256 amountIn, uint256 minAmountOut)`][PegStabilityModule-mint-address-uint256-uint256-]
- [`getMintAmountOut(uint256 amountIn)`][PegStabilityModule-getMintAmountOut-uint256-]
- [`getRedeemAmountOut(uint256 amountFeiIn)`][PegStabilityModule-getRedeemAmountOut-uint256-]
- [`getMaxMintAmountOut()`][PegStabilityModule-getMaxMintAmountOut--]
- [`hasSurplus()`][PegStabilityModule-hasSurplus--]
- [`reservesSurplus()`][PegStabilityModule-reservesSurplus--]
- [`balance()`][PegStabilityModule-balance--]
- [`balanceReportedIn()`][PegStabilityModule-balanceReportedIn--]
- [`resistantBalanceAndFei()`][PegStabilityModule-resistantBalanceAndFei--]
- [`_getMintAmountOut(uint256 amountIn)`][PegStabilityModule-_getMintAmountOut-uint256-]
- [`_getRedeemAmountOut(uint256 amountFeiIn)`][PegStabilityModule-_getRedeemAmountOut-uint256-]
- [`_allocate(uint256 amount)`][PegStabilityModule-_allocate-uint256-]
- [`_transfer(address to, uint256 amount)`][PegStabilityModule-_transfer-address-uint256-]
- [`_transferFrom(address from, address to, uint256 amount)`][PegStabilityModule-_transferFrom-address-address-uint256-]
- [`_mintFei(address to, uint256 amount)`][PegStabilityModule-_mintFei-address-uint256-]
- [`_validatePriceRange(struct Decimal.D256 price)`][PegStabilityModule-_validatePriceRange-struct-Decimal-D256-]
- [`withdrawERC20(address token, address to, uint256 amount)`][PCVDeposit-withdrawERC20-address-address-uint256-]
- [`_withdrawERC20(address token, address to, uint256 amount)`][PCVDeposit-_withdrawERC20-address-address-uint256-]
- [`withdrawETH(address payable to, uint256 amountOut)`][PCVDeposit-withdrawETH-address-payable-uint256-]
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
- [`setRateLimitPerSecond(uint256 newRateLimitPerSecond)`][RateLimited-setRateLimitPerSecond-uint256-]
- [`setBufferCap(uint256 newBufferCap)`][RateLimited-setBufferCap-uint256-]
- [`buffer()`][RateLimited-buffer--]
- [`_depleteBuffer(uint256 amount)`][RateLimited-_depleteBuffer-uint256-]
- [`_setRateLimitPerSecond(uint256 newRateLimitPerSecond)`][RateLimited-_setRateLimitPerSecond-uint256-]
- [`_setBufferCap(uint256 newBufferCap)`][RateLimited-_setBufferCap-uint256-]
- [`_resetBuffer()`][RateLimited-_resetBuffer--]
- [`_updateBufferStored()`][RateLimited-_updateBufferStored--]
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
- [`reservesThreshold()`][IPegStabilityModule-reservesThreshold--]
- [`mintFeeBasisPoints()`][IPegStabilityModule-mintFeeBasisPoints--]
- [`redeemFeeBasisPoints()`][IPegStabilityModule-redeemFeeBasisPoints--]
- [`underlyingToken()`][IPegStabilityModule-underlyingToken--]
- [`surplusTarget()`][IPegStabilityModule-surplusTarget--]
- [`MAX_FEE()`][IPegStabilityModule-MAX_FEE--]
- [`RedemptionsPaused(address account)`][PegStabilityModule-RedemptionsPaused-address-]
- [`RedemptionsUnpaused(address account)`][PegStabilityModule-RedemptionsUnpaused-address-]
- [`MintingPaused(address account)`][PegStabilityModule-MintingPaused-address-]
- [`MintingUnpaused(address account)`][PegStabilityModule-MintingUnpaused-address-]
- [`BufferUsed(uint256 amountUsed, uint256 bufferRemaining)`][RateLimited-BufferUsed-uint256-uint256-]
- [`BufferCapUpdate(uint256 oldBufferCap, uint256 newBufferCap)`][RateLimited-BufferCapUpdate-uint256-uint256-]
- [`RateLimitPerSecondUpdate(uint256 oldRateLimitPerSecond, uint256 newRateLimitPerSecond)`][RateLimited-RateLimitPerSecondUpdate-uint256-uint256-]
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
- [`AllocateSurplus(address caller, uint256 amount)`][IPegStabilityModule-AllocateSurplus-address-uint256-]
- [`MaxFeeUpdate(uint256 oldMaxFee, uint256 newMaxFee)`][IPegStabilityModule-MaxFeeUpdate-uint256-uint256-]
- [`MintFeeUpdate(uint256 oldMintFee, uint256 newMintFee)`][IPegStabilityModule-MintFeeUpdate-uint256-uint256-]
- [`RedeemFeeUpdate(uint256 oldRedeemFee, uint256 newRedeemFee)`][IPegStabilityModule-RedeemFeeUpdate-uint256-uint256-]
- [`ReservesThresholdUpdate(uint256 oldReservesThreshold, uint256 newReservesThreshold)`][IPegStabilityModule-ReservesThresholdUpdate-uint256-uint256-]
- [`SurplusTargetUpdate(contract IPCVDeposit oldTarget, contract IPCVDeposit newTarget)`][IPegStabilityModule-SurplusTargetUpdate-contract-IPCVDeposit-contract-IPCVDeposit-]
- [`Redeem(address to, uint256 amountFeiIn, uint256 amountAssetOut)`][IPegStabilityModule-Redeem-address-uint256-uint256-]
- [`Mint(address to, uint256 amountIn, uint256 amountFeiOut)`][IPegStabilityModule-Mint-address-uint256-uint256-]
### <span id="PegStabilityModule-whileRedemptionsNotPaused--"></span> `whileRedemptionsNotPaused()`



### <span id="PegStabilityModule-whileMintingNotPaused--"></span> `whileMintingNotPaused()`



### <span id="PegStabilityModule-constructor-struct-PegStabilityModule-OracleParams-uint256-uint256-uint256-uint256-uint256-contract-IERC20-contract-IPCVDeposit-"></span> `constructor(struct PegStabilityModule.OracleParams params, uint256 _mintFeeBasisPoints, uint256 _redeemFeeBasisPoints, uint256 _reservesThreshold, uint256 _feiLimitPerSecond, uint256 _mintingBufferCap, contract IERC20 _underlyingToken, contract IPCVDeposit _surplusTarget)` (public)



### <span id="PegStabilityModule-pauseRedeem--"></span> `pauseRedeem()` (external)



### <span id="PegStabilityModule-unpauseRedeem--"></span> `unpauseRedeem()` (external)



### <span id="PegStabilityModule-pauseMint--"></span> `pauseMint()` (external)



### <span id="PegStabilityModule-unpauseMint--"></span> `unpauseMint()` (external)



### <span id="PegStabilityModule-withdraw-address-uint256-"></span> `withdraw(address to, uint256 amount)` (external)



### <span id="PegStabilityModule-setMintFee-uint256-"></span> `setMintFee(uint256 newMintFeeBasisPoints)` (external)



### <span id="PegStabilityModule-setRedeemFee-uint256-"></span> `setRedeemFee(uint256 newRedeemFeeBasisPoints)` (external)



### <span id="PegStabilityModule-setReservesThreshold-uint256-"></span> `setReservesThreshold(uint256 newReservesThreshold)` (external)



### <span id="PegStabilityModule-setSurplusTarget-contract-IPCVDeposit-"></span> `setSurplusTarget(contract IPCVDeposit newTarget)` (external)



### <span id="PegStabilityModule-_setMintFee-uint256-"></span> `_setMintFee(uint256 newMintFeeBasisPoints)` (internal)



### <span id="PegStabilityModule-_setRedeemFee-uint256-"></span> `_setRedeemFee(uint256 newRedeemFeeBasisPoints)` (internal)



### <span id="PegStabilityModule-_setReservesThreshold-uint256-"></span> `_setReservesThreshold(uint256 newReservesThreshold)` (internal)



### <span id="PegStabilityModule-_setSurplusTarget-contract-IPCVDeposit-"></span> `_setSurplusTarget(contract IPCVDeposit newSurplusTarget)` (internal)



### <span id="PegStabilityModule-allocateSurplus--"></span> `allocateSurplus()` (external)



### <span id="PegStabilityModule-deposit--"></span> `deposit()` (external)



### <span id="PegStabilityModule-_redeem-address-uint256-uint256-"></span> `_redeem(address to, uint256 amountFeiIn, uint256 minAmountOut) → uint256 amountOut` (internal)



### <span id="PegStabilityModule-_mint-address-uint256-uint256-"></span> `_mint(address to, uint256 amountIn, uint256 minAmountOut) → uint256 amountFeiOut` (internal)



### <span id="PegStabilityModule-redeem-address-uint256-uint256-"></span> `redeem(address to, uint256 amountFeiIn, uint256 minAmountOut) → uint256 amountOut` (external)



### <span id="PegStabilityModule-mint-address-uint256-uint256-"></span> `mint(address to, uint256 amountIn, uint256 minAmountOut) → uint256 amountFeiOut` (external)



### <span id="PegStabilityModule-getMintAmountOut-uint256-"></span> `getMintAmountOut(uint256 amountIn) → uint256 amountFeiOut` (public)



### <span id="PegStabilityModule-getRedeemAmountOut-uint256-"></span> `getRedeemAmountOut(uint256 amountFeiIn) → uint256 amountTokenOut` (public)



### <span id="PegStabilityModule-getMaxMintAmountOut--"></span> `getMaxMintAmountOut() → uint256` (external)



### <span id="PegStabilityModule-hasSurplus--"></span> `hasSurplus() → bool` (external)



### <span id="PegStabilityModule-reservesSurplus--"></span> `reservesSurplus() → int256` (public)



### <span id="PegStabilityModule-balance--"></span> `balance() → uint256` (public)



### <span id="PegStabilityModule-balanceReportedIn--"></span> `balanceReportedIn() → address` (external)



### <span id="PegStabilityModule-resistantBalanceAndFei--"></span> `resistantBalanceAndFei() → uint256, uint256` (public)



### <span id="PegStabilityModule-_getMintAmountOut-uint256-"></span> `_getMintAmountOut(uint256 amountIn) → uint256 amountFeiOut` (internal)

will revert if price is outside of bounds and bounded PSM is being used

### <span id="PegStabilityModule-_getRedeemAmountOut-uint256-"></span> `_getRedeemAmountOut(uint256 amountFeiIn) → uint256 amountTokenOut` (internal)

will revert if price is outside of bounds and bounded PSM is being used

### <span id="PegStabilityModule-_allocate-uint256-"></span> `_allocate(uint256 amount)` (internal)



### <span id="PegStabilityModule-_transfer-address-uint256-"></span> `_transfer(address to, uint256 amount)` (internal)



### <span id="PegStabilityModule-_transferFrom-address-address-uint256-"></span> `_transferFrom(address from, address to, uint256 amount)` (internal)



### <span id="PegStabilityModule-_mintFei-address-uint256-"></span> `_mintFei(address to, uint256 amount)` (internal)



### <span id="PegStabilityModule-_validatePriceRange-struct-Decimal-D256-"></span> `_validatePriceRange(struct Decimal.D256 price)` (internal)



### <span id="PegStabilityModule-RedemptionsPaused-address-"></span> `RedemptionsPaused(address account)`



### <span id="PegStabilityModule-RedemptionsUnpaused-address-"></span> `RedemptionsUnpaused(address account)`



### <span id="PegStabilityModule-MintingPaused-address-"></span> `MintingPaused(address account)`



### <span id="PegStabilityModule-MintingUnpaused-address-"></span> `MintingUnpaused(address account)`



