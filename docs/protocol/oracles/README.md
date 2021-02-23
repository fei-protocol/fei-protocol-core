---
description: Determining the target FEI price
---

# Oracles

Fei Protocol has two distinct oracles that different components in the system point to. The primary oracle reads the USDC/ETH 10 minute time-weighted average price \(TWAP\). This oracle uses a snapshot approach, so for each 10-minute interval the peg is fixed from the Fei Protocol perspective. The only contract in Fei Protocol that uses the primary oracle is the [bonding curve](../bondingcurve/).

{% embed url="https://uniswap.org/docs/v2/core-concepts/oracles/" caption="Uniswap Oracles" %}

All other components in the system use the secondary oracle, "bonding curve oracle". Pre-Scale, this oracle references the bonding curve price rather than the primary oracle price. E.g., if the bonding curve is at a multiplier of $0.75, then the direct peg incentives on uniswap are targeting the distance from a $0.75 FEI price rather than the long term intended $1. 

## Thawing

An important feature of the bonding curve oracle is the ability to "thaw" from a lower target price up to the target bonding curve price. Thawing is used to mitigate unhealthy arbitrage opportunities that arise due to Genesis participation. This arbitrage is a general feature of any system which has the following properties:

* A group of user transactions are bundled together
* There is open participation in the group
* There is slippage in the price
* The inverse transaction can be made immediately after the bundled transaction

An arbitrageur could participate in the grouped transaction with the intention of being the first one to make the opposite trade. The average price of the group transaction would necessarily be lower than the very next listing price. The arbitrageur, if first to sell, would capitalize on the spread between these two prices.  


To use an example from a naive approach to the FEI bonding curve, let's say the Genesis Group fully makes it to the Scale target with an average price of $0.80. If Fei Protocol immediately lists FEI at the current bonding curve price of $1.00, then an arbitrageur can participate in Genesis knowing they will make a 20% profit if they are the first to sell after Genesis. Because of the 10% TRIBE bonus which can also be sold for FEI, this trade becomes even more profitable.

  
The solution is that the bonding curve oracle starts out by reporting a 10% discount on the average Genesis price as opposed to the next bonding curve price. This mitigates any pure arbitrage opportunities for participating in Genesis, even with the TRIBE bonus. The bonding curve will linearly shift towards reporting the intended bonding curve peg price over a 2 week window. This means that all incentives and PCV deposits will apply to this lower price. The peg gradually increases until the thawing period is over.

