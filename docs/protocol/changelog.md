---
description: A documentation of protocol changes since the white paper release
---

# Changelog

## Pre-Launch - Feb 2021

#### Thawing

One problem with the white paper specification for the Genesis Group is that the average price paid is always lower than the "next price" and this is the price that is listed on Uniswap. This creates a perverse incentive to participate in the Genesis Group and immediately sell on Uniswap to arbitrage the group. To solve this we added "thawing" where the list price starts at the average genesis price and slowly thaws up to the target peg.

{% page-ref page="oracles/" %}

#### Allocation

In the white paper, bonding curve purchases of FEI for ETH directly fund the PCV with that ETH. Thanks to a recommendation from Ashwin Ramachandran, we are splitting out this allocation to Uniswap into a separate flow available for keepers. This brings bonding curve purchases down to around 100k gas, a 66% reduction making it cheaper than most Uniswap purchases! These batched transactions are always available, and incentivized once a day for 500 FEI.

{% page-ref page="bondingcurve/" %}

#### Reweight Reward

PCV reweights receive a flat reward in FEI rather than the percentage approach mentioned in the white paper.

{% page-ref page="protocol-controlled-value/" %}

#### Escape Genesis

As a measure of precaution, we added a way to convert FGEN Genesis shares back into ETH in the event that the GenesisGroup `launch` function is frozen in a bad state. This opens 3 days post Genesis. 

{% page-ref page="genesis/" %}

#### Pre-Buy TRIBE

To mitigate frontrunning of TRIBE in the DEX offering, we allow users to pre-commit a portion their Genesis Group FEI stake to buy TRIBE. This gives users the ability to participate in the very first TRIBE purchase at the best IDO price.

{% page-ref page="genesis/" %}

#### Bonding Curve Shift

In the white paper, the bonding curve starts at a 0 price and approaches the peg at the scale target. We added a "k" shift which starts the curve higher up and at a higher price. The reasoning for this is to have lower undercollateralization in the PCV.

{% page-ref page="bondingcurve/" %}

#### Restricted Selling

There is a bug in the white paper "exclusive" fee model which means that a user can transfer tokens straight from a pool \(such as a Uniswap LP pool\) into the primary ETH/FEI incentivized pair. This has the pool subsidize the user's burn for selling. We restricted all transfers of FEI into the incentivized pair to only governance allowlisted addresses.  The list includes the custom [FeiRouter](trading/feirouter.md).

{% page-ref page="fei-stablecoin/" %}

#### Router

We added a custom Uniswap router which allows the user to bound their buy rewards or sell penalties when trading on the incentivized uniswap pool.

{% page-ref page="trading/" %}

## White paper - Jan 11, 2021

{% page-ref page="../whitepaper.md" %}



