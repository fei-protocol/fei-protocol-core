---
description: Protocol changes since the white paper release
---

# Changelog

## Pre-Launch - Feb 2021

#### Thawing

The white paper specification for the Genesis Group doesn’t address the unintended effect that the average price paid is always lower than the "next price" which is the price that is listed on Uniswap. This creates a perverse incentive to participate in the Genesis Group to arbitrage the group. To solve this we have implemented "thawing" where the list price of FEI/ETH starts at a discount to the average genesis price and thaws up to the target peg over 2 weeks.

{% page-ref page="oracles/" %}

#### Allocation

In the white paper, bonding curve purchases of FEI directly fund \(ETH\) the PCV. Thanks to a recommendation from Ashwin Ramachandran, we are splitting this allocation to Uniswap into a separate flow available for keepers. This lowers bonding curve purchases to around 100k gas, a 66% reduction, making it cheaper than most Uniswap purchases! These batched transactions are always available and incentivized once a day for 500 FEI.

{% page-ref page="bondingcurve/" %}

#### Reweight Reward

PCV reweights receive a flat reward in FEI rather than the percentage approach mentioned in the white paper.

{% page-ref page="protocol-controlled-value/" %}

#### Escape Genesis

In the unlikely event that the GenesisGroup launch function is frozen in a bad state, we’ve added a way to exit back into ETH. This opens 3 days post Genesis.

{% page-ref page="genesis/" %}

#### Pre-Buy TRIBE

To mitigate frontrunning of TRIBE in the DEX offering, we allow users to pre-buy a portion of their Genesis Group FEI stake to buy TRIBE. This gives users the ability to participate in the very first TRIBE purchase at the best IDO price.

{% page-ref page="genesis/" %}

#### Bonding Curve Shift

In the white paper, the bonding curve starts at a 0 price and approaches the peg at the scale target. To achieve lower undercollateralization in the PCV, we’ve added a “k” shift to initiate the bonding curve higher up at an elevated starting price.

{% page-ref page="bondingcurve/" %}

#### Router

A custom Uniswap router that allows the user to bound their buy rewards or sell penalties when trading on the incentivized uniswap pool.

{% page-ref page="trading/" %}

## White paper - Jan 11, 2021

{% page-ref page="../whitepaper.md" %}



