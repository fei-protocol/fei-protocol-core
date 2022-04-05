## `FixedPricePSM`






### `constructor(uint256 _floor, uint256 _ceiling, struct PegStabilityModule.OracleParams _params, uint256 _mintFeeBasisPoints, uint256 _redeemFeeBasisPoints, uint256 _reservesThreshold, uint256 _feiLimitPerSecond, uint256 _mintingBufferCap, contract IERC20 _underlyingToken, contract IPCVDeposit _surplusTarget)` (public)





### `_getMintAmountOut(uint256 amountIn) → uint256 amountFeiOut` (internal)

helper function to get mint amount out based on current market prices


will revert if price is outside of bounds and bounded PSM is being used

### `_getRedeemAmountOut(uint256 amountFeiIn) → uint256 amountTokenOut` (internal)

helper function to get redeem amount out based on current market prices


will revert if price is outside of bounds and bounded PSM is being used




