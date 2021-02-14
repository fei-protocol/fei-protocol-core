---
description: 'The fair, scalable issuance mechanism for FEI'
---

# Bonding Curves

## Bonding Curves

Bonding curves are price functions for a token which usually take in the current circulating supply as a parameter in the formula. They are generally monotonically increasing, as early adopters should get a better deal than later adopters.

When coupled with a smart contract, bonding curves can escrow, buy and sell tokens in accordance with the price function. The contract can even take fees for buying and selling as a fundraising mechanism for [Protocol Controlled Value](../protocol-controlled-value/). 

Here is a link to a well-done article by Linum Labs with more details:

{% embed url="https://medium.com/linum-labs/intro-to-bonding-curves-and-shapes-bf326bc4e11a" %}



## Fei Protocol Bonding Curves

Fei Protocol's primary issuance mechanism for FEI are bonding curves. These bonding curves can have any parameterization but should follow the below pattern:

* Use a curve with a desirable growth rate
* Have a "shift" that determines the starting price
* Have a "Scale" target at which the curve switches to fixed relative to the oracle peg
* Have a "buffer" which is a percentage premium above the peg that the curve trades at post-Scale

![](../../.gitbook/assets/screen-shot-2021-02-13-at-7.34.17-pm.png)

{% hint style="success" %}
The Fei Core Team feels strongly that Fei Protocol should only issue bonding curves denominated in decentralized tokens
{% endhint %}

Fei Protocol bonding curves have some other unique features. Firstly, they are buy-only, which means that purchasers must go elsewhere to sell their FEI. Luckily, the protocol prioritizes PCV liquidity with the assets it receives from the curve. Secondly, the price function is not based on the total circulating supply of FEI but only based on the amount of FEI purchased on that single bonding curve.

Fei Protocol is launching with a single, ETH denominated bonding curve with plans for many more as the protocol scales.

