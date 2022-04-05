## <span id="IPegStabilityModule"></span> `IPegStabilityModule`



- [`mint(address to, uint256 amountIn, uint256 minAmountOut)`][IPegStabilityModule-mint-address-uint256-uint256-]
- [`redeem(address to, uint256 amountFeiIn, uint256 minAmountOut)`][IPegStabilityModule-redeem-address-uint256-uint256-]
- [`allocateSurplus()`][IPegStabilityModule-allocateSurplus--]
- [`setMintFee(uint256 newMintFeeBasisPoints)`][IPegStabilityModule-setMintFee-uint256-]
- [`setRedeemFee(uint256 newRedeemFeeBasisPoints)`][IPegStabilityModule-setRedeemFee-uint256-]
- [`setReservesThreshold(uint256 newReservesThreshold)`][IPegStabilityModule-setReservesThreshold-uint256-]
- [`setSurplusTarget(contract IPCVDeposit newTarget)`][IPegStabilityModule-setSurplusTarget-contract-IPCVDeposit-]
- [`getMintAmountOut(uint256 amountIn)`][IPegStabilityModule-getMintAmountOut-uint256-]
- [`getRedeemAmountOut(uint256 amountFeiIn)`][IPegStabilityModule-getRedeemAmountOut-uint256-]
- [`getMaxMintAmountOut()`][IPegStabilityModule-getMaxMintAmountOut--]
- [`hasSurplus()`][IPegStabilityModule-hasSurplus--]
- [`reservesSurplus()`][IPegStabilityModule-reservesSurplus--]
- [`reservesThreshold()`][IPegStabilityModule-reservesThreshold--]
- [`mintFeeBasisPoints()`][IPegStabilityModule-mintFeeBasisPoints--]
- [`redeemFeeBasisPoints()`][IPegStabilityModule-redeemFeeBasisPoints--]
- [`underlyingToken()`][IPegStabilityModule-underlyingToken--]
- [`surplusTarget()`][IPegStabilityModule-surplusTarget--]
- [`MAX_FEE()`][IPegStabilityModule-MAX_FEE--]
- [`AllocateSurplus(address caller, uint256 amount)`][IPegStabilityModule-AllocateSurplus-address-uint256-]
- [`MaxFeeUpdate(uint256 oldMaxFee, uint256 newMaxFee)`][IPegStabilityModule-MaxFeeUpdate-uint256-uint256-]
- [`MintFeeUpdate(uint256 oldMintFee, uint256 newMintFee)`][IPegStabilityModule-MintFeeUpdate-uint256-uint256-]
- [`RedeemFeeUpdate(uint256 oldRedeemFee, uint256 newRedeemFee)`][IPegStabilityModule-RedeemFeeUpdate-uint256-uint256-]
- [`ReservesThresholdUpdate(uint256 oldReservesThreshold, uint256 newReservesThreshold)`][IPegStabilityModule-ReservesThresholdUpdate-uint256-uint256-]
- [`SurplusTargetUpdate(contract IPCVDeposit oldTarget, contract IPCVDeposit newTarget)`][IPegStabilityModule-SurplusTargetUpdate-contract-IPCVDeposit-contract-IPCVDeposit-]
- [`Redeem(address to, uint256 amountFeiIn, uint256 amountAssetOut)`][IPegStabilityModule-Redeem-address-uint256-uint256-]
- [`Mint(address to, uint256 amountIn, uint256 amountFeiOut)`][IPegStabilityModule-Mint-address-uint256-uint256-]
### <span id="IPegStabilityModule-mint-address-uint256-uint256-"></span> `mint(address to, uint256 amountIn, uint256 minAmountOut) → uint256 amountFeiOut` (external)

see getMintAmountOut() to pre-calculate amount out

### <span id="IPegStabilityModule-redeem-address-uint256-uint256-"></span> `redeem(address to, uint256 amountFeiIn, uint256 minAmountOut) → uint256 amountOut` (external)

see getRedeemAmountOut() to pre-calculate amount out

### <span id="IPegStabilityModule-allocateSurplus--"></span> `allocateSurplus()` (external)



### <span id="IPegStabilityModule-setMintFee-uint256-"></span> `setMintFee(uint256 newMintFeeBasisPoints)` (external)



### <span id="IPegStabilityModule-setRedeemFee-uint256-"></span> `setRedeemFee(uint256 newRedeemFeeBasisPoints)` (external)



### <span id="IPegStabilityModule-setReservesThreshold-uint256-"></span> `setReservesThreshold(uint256 newReservesThreshold)` (external)



### <span id="IPegStabilityModule-setSurplusTarget-contract-IPCVDeposit-"></span> `setSurplusTarget(contract IPCVDeposit newTarget)` (external)



### <span id="IPegStabilityModule-getMintAmountOut-uint256-"></span> `getMintAmountOut(uint256 amountIn) → uint256 amountFeiOut` (external)



### <span id="IPegStabilityModule-getRedeemAmountOut-uint256-"></span> `getRedeemAmountOut(uint256 amountFeiIn) → uint256 amountOut` (external)



### <span id="IPegStabilityModule-getMaxMintAmountOut--"></span> `getMaxMintAmountOut() → uint256` (external)



### <span id="IPegStabilityModule-hasSurplus--"></span> `hasSurplus() → bool` (external)



### <span id="IPegStabilityModule-reservesSurplus--"></span> `reservesSurplus() → int256` (external)



### <span id="IPegStabilityModule-reservesThreshold--"></span> `reservesThreshold() → uint256` (external)



### <span id="IPegStabilityModule-mintFeeBasisPoints--"></span> `mintFeeBasisPoints() → uint256` (external)



### <span id="IPegStabilityModule-redeemFeeBasisPoints--"></span> `redeemFeeBasisPoints() → uint256` (external)



### <span id="IPegStabilityModule-underlyingToken--"></span> `underlyingToken() → contract IERC20` (external)



### <span id="IPegStabilityModule-surplusTarget--"></span> `surplusTarget() → contract IPCVDeposit` (external)



### <span id="IPegStabilityModule-MAX_FEE--"></span> `MAX_FEE() → uint256` (external)



### <span id="IPegStabilityModule-AllocateSurplus-address-uint256-"></span> `AllocateSurplus(address caller, uint256 amount)`



### <span id="IPegStabilityModule-MaxFeeUpdate-uint256-uint256-"></span> `MaxFeeUpdate(uint256 oldMaxFee, uint256 newMaxFee)`



### <span id="IPegStabilityModule-MintFeeUpdate-uint256-uint256-"></span> `MintFeeUpdate(uint256 oldMintFee, uint256 newMintFee)`



### <span id="IPegStabilityModule-RedeemFeeUpdate-uint256-uint256-"></span> `RedeemFeeUpdate(uint256 oldRedeemFee, uint256 newRedeemFee)`



### <span id="IPegStabilityModule-ReservesThresholdUpdate-uint256-uint256-"></span> `ReservesThresholdUpdate(uint256 oldReservesThreshold, uint256 newReservesThreshold)`



### <span id="IPegStabilityModule-SurplusTargetUpdate-contract-IPCVDeposit-contract-IPCVDeposit-"></span> `SurplusTargetUpdate(contract IPCVDeposit oldTarget, contract IPCVDeposit newTarget)`



### <span id="IPegStabilityModule-Redeem-address-uint256-uint256-"></span> `Redeem(address to, uint256 amountFeiIn, uint256 amountAssetOut)`



### <span id="IPegStabilityModule-Mint-address-uint256-uint256-"></span> `Mint(address to, uint256 amountIn, uint256 amountFeiOut)`



