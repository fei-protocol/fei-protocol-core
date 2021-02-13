# EthBondingCurve

## Contract

[EthBondingCurve.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/bondingcurve/EthBondingCurve.sol) implements [BondingCurve](https://github.com/fei-protocol/fei-protocol-core/wiki/BondingCurve)

## Description

A bonding curve implementation for purchasing FEI with ETH

## [Access Control](../../access-control/) 

* Minter💰

## Implementation

In the whitepaper, the price function is `(X/S)^1/2 * O` with X being the current FEI\_b, S being the Scale target and O being the oracle price.

`k` below is out of scope for OpenZeppelin audit The implementation differs slightly from the whitepaper in that there is a shift variable `k` which starts us off further along the curve. The adjusted price formula looks like `((X+k)/(S+k))^1/2 * O`. The integral solved for the upper bound from current level of supply `C` + the `k` shift is equal to [link](https://ibb.co/3mrX90r)

The scale target is 250,000,000 FEI.

The oracle used is the [UniswapOracle](https://github.com/fei-protocol/fei-protocol-core/wiki/UniswapOracle) as the goal of the bonding curve is to report relative to the true peg for pricing.

