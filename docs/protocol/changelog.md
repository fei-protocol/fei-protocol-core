---
description: A documentation of protocol changes since the white paper release
---

# Changelog

## Pre-Launch - Feb 2021

#### Thawing

One problem with the whitepaper specification for the Genesis Group is that the average price paid is always lower than the "next price" and this is the price that is listed on Uniswap. This creates a perverse incentive to participate in the Genesis Group and immediately tank the price on Uniswap. To solve this we added "thawing" where the list price starts at the average genesis price and slowly thaws up to the target peg.

This feature is explained in detail [here](https://github.com/fei-protocol/fei-protocol-core/wiki/BondingCurveOracle).

#### Allocation

In the whitepaper, bonding curve purchases of FEI for ETH directly fund the PCV with that ETH. This is wasteful from a gas perspective and as this is an important user flow we decided to batch the allocation of ETH. These batched transactions are always available, and incentivized once a day for 500 FEI.

The feature is explained in detail [here](https://github.com/fei-protocol/fei-protocol-core/wiki/BondingCurve).

#### Reweight Reward

Reweights receive a flat reward in FEI rather than the percentage approach mentioned in the whitepaper. More details [here](https://github.com/fei-protocol/fei-protocol-core/wiki/EthUniswapPCVController)

#### Escape Genesis

As a measure of precaution, we added a way to convert FGEN shares back into ETH in the event that the GenesisGroup `launch` function is frozen in a bad state. This opens 3 days post Genesis. See the discussion at the end of the Redemption section [here](https://github.com/fei-protocol/fei-protocol-core/wiki/GenesisGroup)

#### Pre-Buy TRIBE

To mitigate frontrunning of TRIBE in the DEX offering, we allow users to pre-commit a portion their Genesis Group FEI stake to buy TRIBE. This gives users the ability to participate in the very first TRIBE purchase at the best IDO price. See the discussion [here](https://github.com/fei-protocol/fei-protocol-core/wiki/GenesisGroup).

#### Bonding Curve Shift

In the whitepaper, the bonding curve starts at a 0 price and approaches the peg at the scale target. We added a shift which starts the curve higher up and at a higher price. The reasoning for this is to have lower undercollateralization in the PCV. See the section on "k" [here](https://github.com/fei-protocol/fei-protocol-core/wiki/EthBondingCurve)

#### Router

We added a custom Uniswap router which allows the user to bound their buy rewards or sell penalties when trading on the incentivized uniswap pool. The doc on it is [here](https://github.com/fei-protocol/fei-protocol-core/wiki/FeiRouter)

## White paper - Jan 11, 2021

{% page-ref page="../whitepaper.md" %}



