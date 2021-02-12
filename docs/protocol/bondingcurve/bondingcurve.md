# BondingCurve

## Contract

[BondingCurve.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/bondingcurve/BondingCurve.sol) implements [IBondingCurve](https://github.com/fei-protocol/fei-protocol-core/wiki/IBondingCurve), [OracleRef](https://github.com/fei-protocol/fei-protocol-core/wiki/OracleRef), [PCVSplitter](https://github.com/fei-protocol/fei-protocol-core/wiki/PCVSplitter)

## Description

An abstract bonding curve for purchasing FEI and routing the purchase asset to PCV

## [Permissions](https://github.com/fei-protocol/fei-protocol-core/wiki/Permissions)

* Minter

## Implementation

Fei Protocol bonding curves should have a couple common features:

* a curve formula which approaches the peg
* a "Scale" issuance target beyond which the peg price fixes
* a "buffer" which is applied on top of the peg price post scale
* maintain a FEI\_b counter to compare to the scale target

The amount of FEI received from a purchase transaction is be determined by integrating the price function between the current FEI\_b amount and the amount after the transaction. We then solve for the upper bound and subtract out the starting point. Once post scale, the price should simply be the peg \* \(1 + buffer\) where the peg is reported as FEI per X. In the implementation we actually use \(1 - buffer\) because the peg is inverted so the price relationship is also inverted.

Incoming PCV should be held temporarily to allow for batch transactions via the `allocate()` function. The PCV allocation should split according to the [PCVSplitter](https://github.com/fei-protocol/fei-protocol-core/wiki/PCVSplitter). While allocations can be called at any time, there is a 500 FEI incentive for calling it after each 1 day window.

