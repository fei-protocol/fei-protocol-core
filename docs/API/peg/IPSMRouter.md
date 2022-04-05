## `IPSMRouter`






### `psm() → contract IPegStabilityModule` (external)

reference to the PegStabilityModule that this router interacts with



### `fei() → contract IFei` (external)

reference to the FEI contract used.



### `getMintAmountOut(uint256 amountIn) → uint256 amountFeiOut` (external)

calculate the amount of FEI out for a given `amountIn` of underlying



### `getRedeemAmountOut(uint256 amountFeiIn) → uint256 amountOut` (external)

calculate the amount of underlying out for a given `amountFeiIn` of FEI



### `getMaxMintAmountOut() → uint256` (external)

the maximum mint amount out



### `getMaxRedeemAmountOut() → uint256` (external)

the maximum redeem amount out



### `mint(address _to, uint256 _minAmountOut, uint256 ethAmountIn) → uint256` (external)

Mints fei to the given address, with a minimum amount required


This wraps ETH and then calls into the PSM to mint the fei. We return the amount of fei minted.


### `redeem(address to, uint256 amountFeiIn, uint256 minAmountOut) → uint256 amountOut` (external)

Redeems fei for ETH
First pull user FEI into this contract
Then call redeem on the PSM to turn the FEI into weth
Withdraw all weth to eth in the router
Send the eth to the specified recipient







