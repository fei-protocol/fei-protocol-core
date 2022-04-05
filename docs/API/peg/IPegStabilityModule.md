## `IPegStabilityModule`

 The Fei PSM is a contract which holds a reserve of assets in order to exchange FEI at $1 of underlying assets with a fee.
`mint()` - buy FEI for $1 of underlying tokens
`redeem()` - sell FEI back for $1 of the same

The contract has a reservesThreshold() of underlying meant to stand ready for redemptions. Any surplus reserves can be sent into the PCV using `allocateSurplus()`

The contract is a
PCVDeposit - to track reserves
OracleRef - to determine price of underlying, and
RateLimitedMinter - to stop infinite mints and related issues (but this is in the implementation due to inheritance-linearization difficulties)

Inspired by MakerDAO PSM, code written without reference




### `mint(address to, uint256 amountIn, uint256 minAmountOut) → uint256 amountFeiOut` (external)

mint `amountFeiOut` FEI to address `to` for `amountIn` underlying tokens


see getMintAmountOut() to pre-calculate amount out

### `redeem(address to, uint256 amountFeiIn, uint256 minAmountOut) → uint256 amountOut` (external)

redeem `amountFeiIn` FEI for `amountOut` underlying tokens and send to address `to`


see getRedeemAmountOut() to pre-calculate amount out

### `allocateSurplus()` (external)

send any surplus reserves to the PCV allocation



### `setMintFee(uint256 newMintFeeBasisPoints)` (external)

set the mint fee vs oracle price in basis point terms



### `setRedeemFee(uint256 newRedeemFeeBasisPoints)` (external)

set the redemption fee vs oracle price in basis point terms



### `setReservesThreshold(uint256 newReservesThreshold)` (external)

set the ideal amount of reserves for the contract to hold for redemptions



### `setSurplusTarget(contract IPCVDeposit newTarget)` (external)

set the target for sending surplus reserves



### `getMintAmountOut(uint256 amountIn) → uint256 amountFeiOut` (external)

calculate the amount of FEI out for a given `amountIn` of underlying



### `getRedeemAmountOut(uint256 amountFeiIn) → uint256 amountOut` (external)

calculate the amount of underlying out for a given `amountFeiIn` of FEI



### `getMaxMintAmountOut() → uint256` (external)

the maximum mint amount out



### `hasSurplus() → bool` (external)

a flag for whether the current balance is above (true) or below and equal (false) to the reservesThreshold



### `reservesSurplus() → int256` (external)

an integer representing the positive surplus or negative deficit of contract balance vs reservesThreshold



### `reservesThreshold() → uint256` (external)

the ideal amount of reserves for the contract to hold for redemptions



### `mintFeeBasisPoints() → uint256` (external)

the mint fee vs oracle price in basis point terms



### `redeemFeeBasisPoints() → uint256` (external)

the redemption fee vs oracle price in basis point terms



### `underlyingToken() → contract IERC20` (external)

the underlying token exchanged for FEI



### `surplusTarget() → contract IPCVDeposit` (external)

the PCV deposit target to send surplus reserves



### `MAX_FEE() → uint256` (external)

the max mint and redeem fee in basis points




### `AllocateSurplus(address caller, uint256 amount)`

event emitted when excess PCV is allocated



### `MaxFeeUpdate(uint256 oldMaxFee, uint256 newMaxFee)`

event emitted when a new max fee is set



### `MintFeeUpdate(uint256 oldMintFee, uint256 newMintFee)`

event emitted when a new mint fee is set



### `RedeemFeeUpdate(uint256 oldRedeemFee, uint256 newRedeemFee)`

event emitted when a new redeem fee is set



### `ReservesThresholdUpdate(uint256 oldReservesThreshold, uint256 newReservesThreshold)`

event emitted when reservesThreshold is updated



### `SurplusTargetUpdate(contract IPCVDeposit oldTarget, contract IPCVDeposit newTarget)`

event emitted when surplus target is updated



### `Redeem(address to, uint256 amountFeiIn, uint256 amountAssetOut)`

event emitted upon a redemption



### `Mint(address to, uint256 amountIn, uint256 amountFeiOut)`

event emitted when fei gets minted





