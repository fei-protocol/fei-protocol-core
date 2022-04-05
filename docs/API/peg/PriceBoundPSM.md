## <span id="PriceBoundPSM"></span> `PriceBoundPSM`



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
- [`constructor(uint256 _floor, uint256 _ceiling, struct PegStabilityModule.OracleParams _params, uint256 _mintFeeBasisPoints, uint256 _redeemFeeBasisPoints, uint256 _reservesThreshold, uint256 _feiLimitPerSecond, uint256 _mintingBufferCap, contract IERC20 _underlyingToken, contract IPCVDeposit _surplusTarget)`][PriceBoundPSM-constructor-uint256-uint256-struct-PegStabilityModule-OracleParams-uint256-uint256-uint256-uint256-uint256-contract-IERC20-contract-IPCVDeposit-]
- [`setOracleFloorBasisPoints(uint256 newFloorBasisPoints)`][PriceBoundPSM-setOracleFloorBasisPoints-uint256-]
- [`setOracleCeilingBasisPoints(uint256 newCeilingBasisPoints)`][PriceBoundPSM-setOracleCeilingBasisPoints-uint256-]
- [`isPriceValid()`][PriceBoundPSM-isPriceValid--]
- [`_setCeilingBasisPoints(uint256 newCeilingBasisPoints)`][PriceBoundPSM-_setCeilingBasisPoints-uint256-]
- [`_setFloorBasisPoints(uint256 newFloorBasisPoints)`][PriceBoundPSM-_setFloorBasisPoints-uint256-]
- [`_validPrice(struct Decimal.D256 price)`][PriceBoundPSM-_validPrice-struct-Decimal-D256-]
- [`_validatePriceRange(struct Decimal.D256 price)`][PriceBoundPSM-_validatePriceRange-struct-Decimal-D256-]
- [`floor()`][IPriceBound-floor--]
- [`ceiling()`][IPriceBound-ceiling--]
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
- [`OracleFloorUpdate(uint256 oldFloor, uint256 newFloor)`][IPriceBound-OracleFloorUpdate-uint256-uint256-]
- [`OracleCeilingUpdate(uint256 oldCeiling, uint256 newCeiling)`][IPriceBound-OracleCeilingUpdate-uint256-uint256-]
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
### <span id="PriceBoundPSM-constructor-uint256-uint256-struct-PegStabilityModule-OracleParams-uint256-uint256-uint256-uint256-uint256-contract-IERC20-contract-IPCVDeposit-"></span> `constructor(uint256 _floor, uint256 _ceiling, struct PegStabilityModule.OracleParams _params, uint256 _mintFeeBasisPoints, uint256 _redeemFeeBasisPoints, uint256 _reservesThreshold, uint256 _feiLimitPerSecond, uint256 _mintingBufferCap, contract IERC20 _underlyingToken, contract IPCVDeposit _surplusTarget)` (public)



### <span id="PriceBoundPSM-setOracleFloorBasisPoints-uint256-"></span> `setOracleFloorBasisPoints(uint256 newFloorBasisPoints)` (external)



### <span id="PriceBoundPSM-setOracleCeilingBasisPoints-uint256-"></span> `setOracleCeilingBasisPoints(uint256 newCeilingBasisPoints)` (external)



### <span id="PriceBoundPSM-isPriceValid--"></span> `isPriceValid() → bool` (external)



### <span id="PriceBoundPSM-_setCeilingBasisPoints-uint256-"></span> `_setCeilingBasisPoints(uint256 newCeilingBasisPoints)` (internal)



### <span id="PriceBoundPSM-_setFloorBasisPoints-uint256-"></span> `_setFloorBasisPoints(uint256 newFloorBasisPoints)` (internal)



### <span id="PriceBoundPSM-_validPrice-struct-Decimal-D256-"></span> `_validPrice(struct Decimal.D256 price) → bool valid` (internal)



### <span id="PriceBoundPSM-_validatePriceRange-struct-Decimal-D256-"></span> `_validatePriceRange(struct Decimal.D256 price)` (internal)



