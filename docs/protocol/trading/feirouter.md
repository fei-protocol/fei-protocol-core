---
description: A Uniswap router for FEI/ETH swaps with incentive boundaries
---

# FeiRouter

## Contract

[FeiRouter.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/router/FeiRouter.sol) implements [IFeiRouter](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/router/FeiRouter.sol), [UniswapSingleEthRouter](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/router/UniswapSingleEthRouter.sol)

## Description

A router for swapping FEI and ETH

The router implements methods for buying and selling Fei using the UniswapSingleEthRouter with a single added slippage parameter to bound Direct Incentives.

For the `buyFei` method the `minReward` parameter is the minimum amount of FEI mint the contract should allow without reverting. This is the mint applied by the [UniswapIncentive](https://github.com/fei-protocol/fei-protocol-core/wiki/UniswapIncentive) contract.

For the `sellFei` method the `maxPenalty` parameter is the maximum amount of FEI burn the contract should allow without reverting. This is the burn applied by the [UniswapIncentive](https://github.com/fei-protocol/fei-protocol-core/wiki/UniswapIncentive) contract.

## State-Changing Functions <a id="state-changing-functions"></a>

### Public

#### buyFei

```javascript
function buyFei(
    uint256 minReward,
    uint256 amountOutMin,
    address to,
    uint256 deadline
) external payable returns (uint256 amountOut);
```

Buy at least `amountOutMin` FEI for ETH and send the ETH to address `to` before the block timestamp exceeds `deadline`. 

Calculates the expected reward by updating the oracle, then calling `getBuyIncentive(amountOutMin)` on the [UniswapIncentive](../fei-stablecoin/uniswapincentive.md) contract, and setting it to 0 if the buyer is exempt.

Revert if the FEI reward received is less than `minReward`.

#### sellFei

```javascript
function sellFei(
    uint256 maxPenalty,
    uint256 amountIn,
    uint256 amountOutMin,
    address to,
    uint256 deadline
) external returns (uint256 amountOut);
```

Sell `amountIn` FEI to receive at least `amountOutMin` ETH and send the FEI to address `to` before the block timestamp exceeds `deadline`. 

Calculates the expected penalty by updating the oracle, then calling `getSellPenalty(amountOutMin)` on the [UniswapIncentive](../fei-stablecoin/uniswapincentive.md) contract, and setting it to 0 if the seller is exempt.

Revert if the FEI penalty received is more than `maxPenalty`.

