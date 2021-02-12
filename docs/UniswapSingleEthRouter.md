## Contract
UniswapSingleEthRouter.sol implements [IUniswapSingleEthRouter](https://github.com/fei-protocol/fei-protocol-core/wiki/IUniswapSingleEthRouter)

## Description
A router for swapping tokens and ETH on a single predetermined pair.

## Implementation
The router implements only two of the standard [Uniswap router](https://uniswap.org/docs/v2/smart-contracts/router02) methods:
* `swapExactETHForTokens`
* `swapExactTokensForETH`

Both have the same standard behavior as the Uniswap router, namely specifying a `amountOutMin` to protect against slippage and a `deadline` to timebox trades