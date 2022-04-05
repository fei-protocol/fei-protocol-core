## `ISaddleSwap`






### `getA() → uint256` (external)





### `getToken(uint8 index) → contract IERC20` (external)





### `getTokenIndex(address tokenAddress) → uint8` (external)





### `getTokenBalance(uint8 index) → uint256` (external)





### `getVirtualPrice() → uint256` (external)





### `calculateSwap(uint8 tokenIndexFrom, uint8 tokenIndexTo, uint256 dx) → uint256` (external)





### `calculateTokenAmount(uint256[] amounts, bool deposit) → uint256` (external)





### `calculateRemoveLiquidity(uint256 amount) → uint256[]` (external)





### `calculateRemoveLiquidityOneToken(uint256 tokenAmount, uint8 tokenIndex) → uint256 availableTokenAmount` (external)





### `swap(uint8 tokenIndexFrom, uint8 tokenIndexTo, uint256 dx, uint256 minDy, uint256 deadline) → uint256` (external)





### `addLiquidity(uint256[] amounts, uint256 minToMint, uint256 deadline) → uint256` (external)





### `removeLiquidity(uint256 amount, uint256[] minAmounts, uint256 deadline) → uint256[]` (external)





### `removeLiquidityOneToken(uint256 tokenAmount, uint8 tokenIndex, uint256 minAmount, uint256 deadline) → uint256` (external)








