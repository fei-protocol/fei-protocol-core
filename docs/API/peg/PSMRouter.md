## `PSMRouter`

the PSM router is an ungoverned, non custodial contract that allows user to seamlessly wrap and unwrap their WETH
for trading against the PegStabilityModule.



### `ensure(uint256 deadline)`






### `constructor(contract IPegStabilityModule _psm, contract IFei _fei)` (public)





### `getMintAmountOut(uint256 amountIn) → uint256 amountFeiOut` (public)

view only pass through function to get amount of FEI out with given amount of ETH in



### `getRedeemAmountOut(uint256 amountFeiIn) → uint256 amountTokenOut` (public)

view only pass through function to get amount of ETH out with given amount of FEI in



### `getMaxMintAmountOut() → uint256` (external)

the maximum mint amount out



### `getMaxRedeemAmountOut() → uint256` (external)

the maximum redeem amount out



### `mint(address to, uint256 minAmountOut, uint256 ethAmountIn) → uint256` (external)

Mints fei to the given address, with a minimum amount required


This wraps ETH and then calls into the PSM to mint the fei. We return the amount of fei minted.


### `mint(address to, uint256 minAmountOut, uint256 deadline, uint256 ethAmountIn) → uint256` (external)

Mints fei to the given address, with a minimum amount required and a deadline


This wraps ETH and then calls into the PSM to mint the fei. We return the amount of fei minted.


### `redeem(address to, uint256 amountFeiIn, uint256 minAmountOut) → uint256` (external)

Redeems fei for ETH
First pull user FEI into this contract
Then call redeem on the PSM to turn the FEI into weth
Withdraw all weth to eth in the router
Send the eth to the specified recipient




### `redeem(address to, uint256 amountFeiIn, uint256 minAmountOut, uint256 deadline) → uint256` (external)

Redeems fei for ETH
First pull user FEI into this contract
Then call redeem on the PSM to turn the FEI into weth
Withdraw all weth to eth in the router
Send the eth to the specified recipient




### `fallback()` (external)

function to receive ether from the weth contract when the redeem function is called
will not accept eth unless there is an active redemption.



### `_mint(address _to, uint256 _minAmountOut, uint256 _ethAmountIn) → uint256` (internal)

helper function to wrap eth and handle mint call to PSM



### `_redeem(address to, uint256 amountFeiIn, uint256 minAmountOut) → uint256 amountOut` (internal)

helper function to deposit user FEI, unwrap weth and send eth to the user
the PSM router receives the weth, then sends it to the specified recipient.






