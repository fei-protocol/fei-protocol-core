## <span id="PSMRouter"></span> `PSMRouter`



- [`ensure(uint256 deadline)`][PSMRouter-ensure-uint256-]
- [`constructor(contract IPegStabilityModule _psm, contract IFei _fei)`][PSMRouter-constructor-contract-IPegStabilityModule-contract-IFei-]
- [`getMintAmountOut(uint256 amountIn)`][PSMRouter-getMintAmountOut-uint256-]
- [`getRedeemAmountOut(uint256 amountFeiIn)`][PSMRouter-getRedeemAmountOut-uint256-]
- [`getMaxMintAmountOut()`][PSMRouter-getMaxMintAmountOut--]
- [`getMaxRedeemAmountOut()`][PSMRouter-getMaxRedeemAmountOut--]
- [`mint(address to, uint256 minAmountOut, uint256 ethAmountIn)`][PSMRouter-mint-address-uint256-uint256-]
- [`mint(address to, uint256 minAmountOut, uint256 deadline, uint256 ethAmountIn)`][PSMRouter-mint-address-uint256-uint256-uint256-]
- [`redeem(address to, uint256 amountFeiIn, uint256 minAmountOut)`][PSMRouter-redeem-address-uint256-uint256-]
- [`redeem(address to, uint256 amountFeiIn, uint256 minAmountOut, uint256 deadline)`][PSMRouter-redeem-address-uint256-uint256-uint256-]
- [`fallback()`][PSMRouter-fallback--]
- [`_mint(address _to, uint256 _minAmountOut, uint256 _ethAmountIn)`][PSMRouter-_mint-address-uint256-uint256-]
- [`_redeem(address to, uint256 amountFeiIn, uint256 minAmountOut)`][PSMRouter-_redeem-address-uint256-uint256-]
- [`psm()`][IPSMRouter-psm--]
- [`fei()`][IPSMRouter-fei--]
### <span id="PSMRouter-ensure-uint256-"></span> `ensure(uint256 deadline)`



### <span id="PSMRouter-constructor-contract-IPegStabilityModule-contract-IFei-"></span> `constructor(contract IPegStabilityModule _psm, contract IFei _fei)` (public)



### <span id="PSMRouter-getMintAmountOut-uint256-"></span> `getMintAmountOut(uint256 amountIn) → uint256 amountFeiOut` (public)



### <span id="PSMRouter-getRedeemAmountOut-uint256-"></span> `getRedeemAmountOut(uint256 amountFeiIn) → uint256 amountTokenOut` (public)



### <span id="PSMRouter-getMaxMintAmountOut--"></span> `getMaxMintAmountOut() → uint256` (external)



### <span id="PSMRouter-getMaxRedeemAmountOut--"></span> `getMaxRedeemAmountOut() → uint256` (external)



### <span id="PSMRouter-mint-address-uint256-uint256-"></span> `mint(address to, uint256 minAmountOut, uint256 ethAmountIn) → uint256` (external)

This wraps ETH and then calls into the PSM to mint the fei. We return the amount of fei minted.


### <span id="PSMRouter-mint-address-uint256-uint256-uint256-"></span> `mint(address to, uint256 minAmountOut, uint256 deadline, uint256 ethAmountIn) → uint256` (external)

This wraps ETH and then calls into the PSM to mint the fei. We return the amount of fei minted.


### <span id="PSMRouter-redeem-address-uint256-uint256-"></span> `redeem(address to, uint256 amountFeiIn, uint256 minAmountOut) → uint256` (external)



### <span id="PSMRouter-redeem-address-uint256-uint256-uint256-"></span> `redeem(address to, uint256 amountFeiIn, uint256 minAmountOut, uint256 deadline) → uint256` (external)



### <span id="PSMRouter-fallback--"></span> `fallback()` (external)



### <span id="PSMRouter-_mint-address-uint256-uint256-"></span> `_mint(address _to, uint256 _minAmountOut, uint256 _ethAmountIn) → uint256` (internal)



### <span id="PSMRouter-_redeem-address-uint256-uint256-"></span> `_redeem(address to, uint256 amountFeiIn, uint256 minAmountOut) → uint256 amountOut` (internal)



