---
description: Buying and selling FEI
---

# Trading

This section applies to buying and selling FEI from the protocol or on incentivized FEI Uniswap pools. Users can always buy and sell on secondary markets where they exist.

## Buying FEI

Users can acquire FEI in the following ways:

* Using the [FeiRouter](feirouter.md), available on the Fei Protocol UI
* Buying from the [bonding curve](../bondingcurve/ethbondingcurve.md)
* Buying directly on the ETH/FEI Uniswap pool

The bonding curve is currently only available to advanced users and arbitrage bots. We'll be working on a feature which optimizes the trading price of our UI by going to the bonding curve if it has a better deal. 

## Selling FEI

{% hint style="warning" %}
Users can only sell FEI through the FeiRouter
{% endhint %}

The router is accessible via our UI, where we have parameters to protect against slippage and bound penalties. Due to a vulnerability in the way direct incentives are calculated on user's balances, we have blocked all FEI transfers into the pair that don't go through our router or an internal contract.  


