## Contract
[FeiPool.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pool/FeiPool.sol)
implements [Pool](https://github.com/fei-protocol/fei-protocol-core/wiki/Pool), [CoreRef](https://github.com/fei-protocol/fei-protocol-core/wiki/CoreRef)

## Description
A Pool contract which rewards staked FEI/TRIBE Uniswap LP token deposits with TRIBE tokens

## Implementation
The release schedule for TRIBE is a linearly decreasing TRIBE distribution. The distribution function is *D(x) = 2R/d - 2Rx/d^2* with a y intercept of 2R/d and a duration of d. This sets the total area under the curve to R which is the target release amount.

We will set the "unreleased function" *U(t)* equal to the integral from t to d of *D(x) dx*. This is the area under the distribution curve for the remainder of the period. Note that for t=d we have the output equal to 0 as all of the TRIBE should be released.

The contract follows the ERC20 specification with FPOOL as the token ticker

The init function is callable post genesis period.

Additionally, TRIBE can be withdrawn via governance in the event of an emergency or reallocation.
