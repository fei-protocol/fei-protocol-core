## `PegStabilityModule`





### `whileRedemptionsNotPaused()`

modifier that allows execution when redemptions are not paused



### `whileMintingNotPaused()`

modifier that allows execution when minting is not paused




### `constructor(struct PegStabilityModule.OracleParams params, uint256 _mintFeeBasisPoints, uint256 _redeemFeeBasisPoints, uint256 _reservesThreshold, uint256 _feiLimitPerSecond, uint256 _mintingBufferCap, contract IERC20 _underlyingToken, contract IPCVDeposit _surplusTarget)` (public)

constructor




### `pauseRedeem()` (external)

set secondary pausable methods to paused



### `unpauseRedeem()` (external)

set secondary pausable methods to unpaused



### `pauseMint()` (external)

set secondary pausable methods to paused



### `unpauseMint()` (external)

set secondary pausable methods to unpaused



### `withdraw(address to, uint256 amount)` (external)

withdraw assets from PSM to an external address



### `setMintFee(uint256 newMintFeeBasisPoints)` (external)

set the mint fee vs oracle price in basis point terms



### `setRedeemFee(uint256 newRedeemFeeBasisPoints)` (external)

set the redemption fee vs oracle price in basis point terms



### `setReservesThreshold(uint256 newReservesThreshold)` (external)

set the ideal amount of reserves for the contract to hold for redemptions



### `setSurplusTarget(contract IPCVDeposit newTarget)` (external)

set the target for sending surplus reserves



### `_setMintFee(uint256 newMintFeeBasisPoints)` (internal)

set the mint fee vs oracle price in basis point terms



### `_setRedeemFee(uint256 newRedeemFeeBasisPoints)` (internal)

internal helper function to set the redemption fee



### `_setReservesThreshold(uint256 newReservesThreshold)` (internal)

helper function to set reserves threshold



### `_setSurplusTarget(contract IPCVDeposit newSurplusTarget)` (internal)

helper function to set the surplus target



### `allocateSurplus()` (external)

send any surplus reserves to the PCV allocation



### `deposit()` (external)

function to receive ERC20 tokens from external contracts



### `_redeem(address to, uint256 amountFeiIn, uint256 minAmountOut) → uint256 amountOut` (internal)

internal helper method to redeem fei in exchange for an external asset



### `_mint(address to, uint256 amountIn, uint256 minAmountOut) → uint256 amountFeiOut` (internal)

internal helper method to mint fei in exchange for an external asset



### `redeem(address to, uint256 amountFeiIn, uint256 minAmountOut) → uint256 amountOut` (external)

function to redeem FEI for an underlying asset
We do not burn Fei; this allows the contract's balance of Fei to be used before the buffer is used
In practice, this helps prevent artificial cycling of mint-burn cycles and prevents a griefing vector.



### `mint(address to, uint256 amountIn, uint256 minAmountOut) → uint256 amountFeiOut` (external)

function to buy FEI for an underlying asset
We first transfer any contract-owned fei, then mint the remaining if necessary



### `getMintAmountOut(uint256 amountIn) → uint256 amountFeiOut` (public)

calculate the amount of FEI out for a given `amountIn` of underlying
First get oracle price of token
Then figure out how many dollars that amount in is worth by multiplying price * amount.
ensure decimals are normalized if on underlying they are not 18



### `getRedeemAmountOut(uint256 amountFeiIn) → uint256 amountTokenOut` (public)

calculate the amount of underlying out for a given `amountFeiIn` of FEI
First get oracle price of token
Then figure out how many dollars that amount in is worth by multiplying price * amount.
ensure decimals are normalized if on underlying they are not 18



### `getMaxMintAmountOut() → uint256` (external)

the maximum mint amount out



### `hasSurplus() → bool` (external)

a flag for whether the current balance is above (true) or below (false) the reservesThreshold



### `reservesSurplus() → int256` (public)

an integer representing the positive surplus or negative deficit of contract balance vs reservesThreshold



### `balance() → uint256` (public)

function from PCVDeposit that must be overriden



### `balanceReportedIn() → address` (external)

returns address of token this contracts balance is reported in



### `resistantBalanceAndFei() → uint256, uint256` (public)

override default behavior of not checking fei balance



### `_getMintAmountOut(uint256 amountIn) → uint256 amountFeiOut` (internal)

helper function to get mint amount out based on current market prices


will revert if price is outside of bounds and bounded PSM is being used

### `_getRedeemAmountOut(uint256 amountFeiIn) → uint256 amountTokenOut` (internal)

helper function to get redeem amount out based on current market prices


will revert if price is outside of bounds and bounded PSM is being used

### `_allocate(uint256 amount)` (internal)

Allocates a portion of escrowed PCV to a target PCV deposit



### `_transfer(address to, uint256 amount)` (internal)

transfer ERC20 token



### `_transferFrom(address from, address to, uint256 amount)` (internal)

transfer assets from user to this contract



### `_mintFei(address to, uint256 amount)` (internal)

mint amount of FEI to the specified user on a rate limit



### `_validatePriceRange(struct Decimal.D256 price)` (internal)

overriden function in the bounded PSM




### `RedemptionsPaused(address account)`

event that is emitted when redemptions are paused



### `RedemptionsUnpaused(address account)`

event that is emitted when redemptions are unpaused



### `MintingPaused(address account)`

event that is emitted when minting is paused



### `MintingUnpaused(address account)`

event that is emitted when minting is unpaused




### `OracleParams`


address coreAddress


address oracleAddress


address backupOracle


int256 decimalsNormalizer


bool doInvert



