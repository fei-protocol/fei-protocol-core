## <span id="ISaddleSwap"></span> `ISaddleSwap`



- [`getA()`][ISaddleSwap-getA--]
- [`getToken(uint8 index)`][ISaddleSwap-getToken-uint8-]
- [`getTokenIndex(address tokenAddress)`][ISaddleSwap-getTokenIndex-address-]
- [`getTokenBalance(uint8 index)`][ISaddleSwap-getTokenBalance-uint8-]
- [`getVirtualPrice()`][ISaddleSwap-getVirtualPrice--]
- [`calculateSwap(uint8 tokenIndexFrom, uint8 tokenIndexTo, uint256 dx)`][ISaddleSwap-calculateSwap-uint8-uint8-uint256-]
- [`calculateTokenAmount(uint256[] amounts, bool deposit)`][ISaddleSwap-calculateTokenAmount-uint256---bool-]
- [`calculateRemoveLiquidity(uint256 amount)`][ISaddleSwap-calculateRemoveLiquidity-uint256-]
- [`calculateRemoveLiquidityOneToken(uint256 tokenAmount, uint8 tokenIndex)`][ISaddleSwap-calculateRemoveLiquidityOneToken-uint256-uint8-]
- [`swap(uint8 tokenIndexFrom, uint8 tokenIndexTo, uint256 dx, uint256 minDy, uint256 deadline)`][ISaddleSwap-swap-uint8-uint8-uint256-uint256-uint256-]
- [`addLiquidity(uint256[] amounts, uint256 minToMint, uint256 deadline)`][ISaddleSwap-addLiquidity-uint256---uint256-uint256-]
- [`removeLiquidity(uint256 amount, uint256[] minAmounts, uint256 deadline)`][ISaddleSwap-removeLiquidity-uint256-uint256---uint256-]
- [`removeLiquidityOneToken(uint256 tokenAmount, uint8 tokenIndex, uint256 minAmount, uint256 deadline)`][ISaddleSwap-removeLiquidityOneToken-uint256-uint8-uint256-uint256-]
### <span id="ISaddleSwap-getA--"></span> `getA() → uint256` (external)



### <span id="ISaddleSwap-getToken-uint8-"></span> `getToken(uint8 index) → contract IERC20` (external)



### <span id="ISaddleSwap-getTokenIndex-address-"></span> `getTokenIndex(address tokenAddress) → uint8` (external)



### <span id="ISaddleSwap-getTokenBalance-uint8-"></span> `getTokenBalance(uint8 index) → uint256` (external)



### <span id="ISaddleSwap-getVirtualPrice--"></span> `getVirtualPrice() → uint256` (external)



### <span id="ISaddleSwap-calculateSwap-uint8-uint8-uint256-"></span> `calculateSwap(uint8 tokenIndexFrom, uint8 tokenIndexTo, uint256 dx) → uint256` (external)



### <span id="ISaddleSwap-calculateTokenAmount-uint256---bool-"></span> `calculateTokenAmount(uint256[] amounts, bool deposit) → uint256` (external)



### <span id="ISaddleSwap-calculateRemoveLiquidity-uint256-"></span> `calculateRemoveLiquidity(uint256 amount) → uint256[]` (external)



### <span id="ISaddleSwap-calculateRemoveLiquidityOneToken-uint256-uint8-"></span> `calculateRemoveLiquidityOneToken(uint256 tokenAmount, uint8 tokenIndex) → uint256 availableTokenAmount` (external)



### <span id="ISaddleSwap-swap-uint8-uint8-uint256-uint256-uint256-"></span> `swap(uint8 tokenIndexFrom, uint8 tokenIndexTo, uint256 dx, uint256 minDy, uint256 deadline) → uint256` (external)



### <span id="ISaddleSwap-addLiquidity-uint256---uint256-uint256-"></span> `addLiquidity(uint256[] amounts, uint256 minToMint, uint256 deadline) → uint256` (external)



### <span id="ISaddleSwap-removeLiquidity-uint256-uint256---uint256-"></span> `removeLiquidity(uint256 amount, uint256[] minAmounts, uint256 deadline) → uint256[]` (external)



### <span id="ISaddleSwap-removeLiquidityOneToken-uint256-uint8-uint256-uint256-"></span> `removeLiquidityOneToken(uint256 tokenAmount, uint8 tokenIndex, uint256 minAmount, uint256 deadline) → uint256` (external)



