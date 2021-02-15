---
description: A Pool for staking FEI/TRIBE Uniswap v2 LP tokens
---

# FeiPool

## Contract

[FeiPool.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pool/FeiPool.sol) implements [Pool](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pool/Pool.sol), [CoreRef](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/CoreRef.sol)

## Description

A [Pool](pool.md) contract which rewards staked FEI/TRIBE Uniswap LP token deposits with TRIBE tokens. Ownership is maintained by fungible FPOOL tokens.

The release schedule for the total reward amount _R_ of TRIBE is a linearly decreasing TRIBE distribution. The distribution function is:

![Distribution function for TRIBE](../../.gitbook/assets/screen-shot-2021-02-14-at-9.39.53-pm.png)

This function has a duration of _d_ before it hits a 0 distribution rate. The area under the curve is _R,_ because the y-intercept is 2R/d, by simply multiplying base times height times 1/2.

We will set the "unreleased function" _U\(t\)_ equal to the area under this curve between the current elapsed time _t_  and the total duration _d._ Note that for t=d we have the output equal to 0 as all of the TRIBE should be released. The formula is as follows:

![The unreleased function for FeiPool](../../.gitbook/assets/screen-shot-2021-02-14-at-9.43.38-pm.png)

## State-Changing Functions <a id="state-changing-functions"></a>

### Governor-Only⚖️

#### governorWithdraw

```javascript
function governorWithdraw(uint256 amount) external;
```

Withdraw `amount` TRIBE tokens from the pool to [Fei Core.](../access-control/core.md)



