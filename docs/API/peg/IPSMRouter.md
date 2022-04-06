## <span id="IPSMRouter"></span> `IPSMRouter`



- [`psm()`][IPSMRouter-psm--]
- [`fei()`][IPSMRouter-fei--]
- [`getMintAmountOut(uint256 amountIn)`][IPSMRouter-getMintAmountOut-uint256-]
- [`getRedeemAmountOut(uint256 amountFeiIn)`][IPSMRouter-getRedeemAmountOut-uint256-]
- [`getMaxMintAmountOut()`][IPSMRouter-getMaxMintAmountOut--]
- [`getMaxRedeemAmountOut()`][IPSMRouter-getMaxRedeemAmountOut--]
- [`mint(address _to, uint256 _minAmountOut, uint256 ethAmountIn)`][IPSMRouter-mint-address-uint256-uint256-]
- [`redeem(address to, uint256 amountFeiIn, uint256 minAmountOut)`][IPSMRouter-redeem-address-uint256-uint256-]
### <span id="IPSMRouter-psm--"></span> `psm() → contract IPegStabilityModule` (external)



### <span id="IPSMRouter-fei--"></span> `fei() → contract IFei` (external)



### <span id="IPSMRouter-getMintAmountOut-uint256-"></span> `getMintAmountOut(uint256 amountIn) → uint256 amountFeiOut` (external)



### <span id="IPSMRouter-getRedeemAmountOut-uint256-"></span> `getRedeemAmountOut(uint256 amountFeiIn) → uint256 amountOut` (external)



### <span id="IPSMRouter-getMaxMintAmountOut--"></span> `getMaxMintAmountOut() → uint256` (external)



### <span id="IPSMRouter-getMaxRedeemAmountOut--"></span> `getMaxRedeemAmountOut() → uint256` (external)



### <span id="IPSMRouter-mint-address-uint256-uint256-"></span> `mint(address _to, uint256 _minAmountOut, uint256 ethAmountIn) → uint256` (external)

This wraps ETH and then calls into the PSM to mint the fei. We return the amount of fei minted.


### <span id="IPSMRouter-redeem-address-uint256-uint256-"></span> `redeem(address to, uint256 amountFeiIn, uint256 minAmountOut) → uint256 amountOut` (external)



