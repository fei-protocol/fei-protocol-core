# BondingCurveOracle

## Contract

[BondingCurveOracle.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/oracle/BondingCurveOracle.sol) implements [IBondingCurveOracle](https://github.com/fei-protocol/fei-protocol-core/wiki/IBondingCurveOracle), [CoreRef](https://github.com/fei-protocol/fei-protocol-core/wiki/CoreRef), [Timed](https://github.com/fei-protocol/fei-protocol-core/wiki/Timed)

## Description

The BondingCurveOracle contract pegs to a linked bonding curve price pre Scale and to a normal UniswapOracle post Scale.

## Implementation

Stores the bonding curve and Uniswap oracle contracts to reference. Reads from the appropriate source depending on whether pre or post scale.

Includes "Thawing". Thawing means that the initial pegged price is lower than the target uniswap/bonding curve price. The reported peg linearly converges on the target peg over a preset duration. The duration is 4 weeks. At the beginning of the window it should fully report the initial price and at the end it should fully report the target price.

The initial price is stored as a Decimal from \[0,1\]. The current price is defined as uniswap peg divided current target peg which should also be \[0,1\]. The reported price is the time weighted price between the initial and current prices. The reported peg is the current uniswap peg divided by the reported price.

Updates to the bonding curve oracle update the linked uniswap oracle.

