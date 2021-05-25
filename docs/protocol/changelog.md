---
description: Protocol changes since the white paper release
---

# Changelog

## FIP-3: Regular Reweights - May 23, 2021

FIP-3 reinstates reweights on the FEI-ETH Uniswap pair with a fixed cadence. This removes the "incentive parity" trigger condition for reweights on the EthUniswapPCVController.

Included parameter changes:

* Set reweight frequency to 4 hours
* Lower the min distance below peg for a reweight from 1% to 0.5%
* Lower reweight keeper reward to 200 FEI

  
The code for these changes can be found here: [https://github.com/fei-protocol/fei-protocol-core/pull/96](https://github.com/fei-protocol/fei-protocol-core/pull/96)

## FIP-5: Bonding Curve Allocation Update - May 18, 2021

FIP-5 updates the bonding curve allocation to send funds to the [EthReserveStabilizer](protocol-controlled-value/ethreservestabilizer.md) via the [EthPCVDripper](protocol-controlled-value/ethpcvdripper.md) instead of to the [EthUniswapPCVDeposit](protocol-controlled-value/ethuniswappcvdeposit.md) as before.

It also includes an update to the [EthUniswapPCVDeposit](protocol-controlled-value/ethuniswappcvdeposit.md) where deposits can only occur when the FEI-ETH spot price is within 1% of the oracle price.

**EthPCVDepositAdapter**

An adapter contract that allows ETH transfers to conform to the IPCVDeposit interface.

{% page-ref page="protocol-controlled-value/ethpcvdepositadapter.md" %}



**RatioPCVController**

A PCV controller that allows for withdrawals of a percentage rather than a raw amount of PCV. This is useful for contracts like the [EthUniswapPCVDeposit](protocol-controlled-value/ethuniswappcvdeposit.md) where the ETH amount held varies based on market conditions.

{% page-ref page="protocol-controlled-value/ratiopcvcontroller.md" %}



The code for these changes can be found here: [https://github.com/fei-protocol/fei-protocol-core/pull/98](https://github.com/fei-protocol/fei-protocol-core/pull/98)

## FIP-2: FEI Redemption and TRIBE Staking Rewards - April 29, 2021

FIP-2 allows FEI redemption at $0.95 and doubles the FEI-TRIBE LP staking rewards

**EthReserveStabilizer**

Responsible for exchanging FEI for ETH at $0.95 relative to the UniswapOracle price. Has the Burner🔥role so that approval is not needed to interact with it. ****Receives ETH in 5k batches from the EthPCVDripper every hour. 

{% page-ref page="protocol-controlled-value/ethreservestabilizer.md" %}

#### EthPCVDripper

Drips ETH to the EthReserveStabilizer in 5k increments every hour. The dripper prevents the EthReserveStabilizer from holding more than 10k ETH allowing a smoother and safer release of potentially large amounts of ETH to target contracts.

The drip can be called by any address and is not incentivized directly with FEI

300k ETH are sent to the EthPCVDripper from the [EthUniswapPCVDeposit](protocol-controlled-value/ethuniswappcvdeposit.md)

{% page-ref page="protocol-controlled-value/ethpcvdripper.md" %}

#### TribeDripper

When the FeiRewardsDistributor receives new TRIBE, it allocates an amount proportional to all prior drips to the very first drip, frontloading the distribution. If the 100 million TRIBE are sent directly to the distributor then the following week would have 6x rewards \(1x base rewards + 100% boost x 5 drips\).

To smoothen out the front-loading, the TribeDripper sends the 100 million TRIBE to the FeiRewardsDistributor over 3 weeks using 47m, 31m, and 22m TRIBE respectively.

Week 1: 1x base rewards + 47% boost x 5 drips = ~3.35x  
Week 2: 1.47x base rewards + 31% x 6 drips = ~3.33x  
Week 3: 1.78x base rewards + 22% x 7 drips = ~3.32x  
Week 4+: 2x base rewards

The TribeDripper is at [https://etherscan.io/address/0x65b3Ea26c492de0c2f2D8Abe84eB831796d6eDb1](https://etherscan.io/address/0x65b3Ea26c492de0c2f2D8Abe84eB831796d6eDb1) with an unincentivized function drip\(\) that can be called weekly for 3 drips

## Pre-Launch - Feb 2021

#### Guardian🛡Role 

The Guardian maintains the ability to revoke roles, and pause certain contracts and methods. It can also force reweights.

{% page-ref page="../governance/fei-guardian.md" %}

#### Thawing

The white paper specification for the Genesis Group doesn’t address the unintended effect that the average price paid is always lower than the "next price" which is the price that is listed on Uniswap. This creates a perverse incentive to participate in the Genesis Group to arbitrage the group. To solve this we have implemented "thawing" where the list price of FEI/ETH starts at the average genesis price and thaws up to the target peg over 2 weeks.

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

#### Pre-Swap TRIBE

To mitigate frontrunning of TRIBE in the DEX offering, we allow users to pre-swap a portion of their Genesis Group FEI stake to buy TRIBE. This gives users the ability to participate in the very first TRIBE purchase at the best IDO price.

{% page-ref page="genesis/" %}

#### IDO Normalization

Given that the pre-swap creates a large slippage and back-running opportunity, a trader could arbitrage the group by joining Genesis and pre-swapping 100% of the FEI for TRIBE with the intention of immediately selling back out.

We now normalize the IDO price **to what the Genesis Group pays including slippage** by burning directly from the pool to prevent this backrunning opportunity.

{% page-ref page="genesis/ido.md" %}

#### Bonding Curve Shift

In the white paper, the bonding curve starts at a 0 price and approaches the peg at the scale target. To achieve lower undercollateralization in the PCV, we’ve added a “k” shift to initiate the bonding curve higher up at an elevated starting price.

{% page-ref page="bondingcurve/" %}

#### Sell Disincentive \(Burn\) Calculation

The current implementation integrates the burn function from the [white paper](../whitepaper.md) with respect to the distance from the peg.

{% page-ref page="fei-stablecoin/uniswapincentive.md" %}

#### Router

A custom Uniswap router that allows the user to bound their buy rewards or sell penalties when trading on the incentivized uniswap pool.

{% page-ref page="trading/" %}

## White paper - Jan 11, 2021

{% page-ref page="../whitepaper.md" %}



