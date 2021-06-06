---
description: A Uniswap router for FEI/ETH swaps with incentive boundaries
---

# FeiRouter

## Contract

[FeiRouter.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/router/FeiRouter.sol) implements [IFeiRouter](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/router/FeiRouter.sol)

## Description

A router for swapping FEI and ETH

The router implements methods for buying and selling FEI with a single added slippage parameter to bound Direct Incentives.

For the `buyFei` method the `minReward` parameter is the minimum amount of FEI mint the contract should allow without reverting. This is the mint applied by the [UniswapIncentive](https://github.com/fei-protocol/fei-protocol-core/wiki/UniswapIncentive) contract.

For the `sellFei` method the `maxPenalty` parameter is the maximum amount of FEI burn the contract should allow without reverting. This is the burn applied by the [UniswapIncentive](https://github.com/fei-protocol/fei-protocol-core/wiki/UniswapIncentive) contract.

## Public State-Changing Functions

### buyFei

```javascript
function buyFei(
    uint256 minReward,
    uint256 amountOutMin,
    address to,
    uint256 deadline
) external payable returns (uint256 amountOut);
```

Buy at least `amountOutMin` FEI for ETH and send the FEI to address `to` before the block timestamp exceeds `deadline`. 

Calculates the reward received by calculating how much the balance of "to" increased beyond the expected amountOut.

Revert if the FEI reward received is less than `minReward`.

{% hint style="warning" %}
If you get a `UNISWAP_V2:TRANSFER`\_`FAILED` error then you may have ran out of gas, or there was another error inside the UniswapIncentive hook execution for the FEI transfer
{% endhint %}

### sellFei

```javascript
function sellFei(
    uint256 maxPenalty,
    uint256 amountIn,
    uint256 amountOutMin,
    address to,
    uint256 deadline
) external returns (uint256 amountOut);
```

Sell `amountIn` FEI to receive at least `amountOutMin` ETH and send the ETH to address `to` before the block timestamp exceeds `deadline`. 

Calculates the penalty by calculating the amount that was removed from in-flight after the FEI transfer to Uniswap.

Revert if the FEI penalty received is more than `maxPenalty`.

## ABIs

{% file src="../../.gitbook/assets/feirouter.json" caption="FeiRouter ABI" %}

{% file src="../../.gitbook/assets/ifeirouter.json" caption="FeiRouter Interface ABI" %}

