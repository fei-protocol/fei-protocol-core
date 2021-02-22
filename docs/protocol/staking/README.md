---
description: TRIBE rewards for liquidity provision
---

# Staking

Fei Protocol has a staking pool in which FEI/TRIBE Uniswap LP tokens are deposited and TRIBE is earned over time.

## Rewards Distribution

The total reward balance is 100,000,000 TRIBE, distributed over 2 years. This represents 10% of the initial TRIBE supply. The rewards distribution rate decreases linearly.

![TRIBE distribution function after 1 year](../../.gitbook/assets/tribe-release.svg)

Distribution is gated by the FeiRewardsDistributor. It calculates the amount which should be released at any given time and drips it to FeiStakingRewards weekly.

{% hint style="success" %}
The drip can be called by any user or contract, and the caller is rewarded a flat 500 FEI incentive for triggering the call.
{% endhint %}

## Staking

Fei Protocol staking allows users to earn more TRIBE tokens while providing liquidity for TRIBE. This is commonly referred to as a [Pool 2](https://blog.chain.link/defi-yield-farming-explained/#:~:text=Pool%202%20refers%20to%20Yield,take%20profits%20on%20their%20yield.) in terms of yield farming. 

The rewards are split evenly among all participants at any given time. In addition, staking is completely fluid. This means users can deposit, earn TRIBE for a few blocks, claim that TRIBE, and then withdraw their staked tokens at their will. In other words, there are no lockups on staked tokens.

In particular, users are staking FEI/TRIBE Uniswap v2 LP tokens to earn the TRIBE rewards. It is possible for the [Fei DAO](../../governance/fei-dao.md) to adjust the distribution rate and the staked token if the need arises.

{% hint style="info" %}
Fei Protocol uses the battle-tested StakingRewards contract used by Synthetix, Yams, and Set Protocol among others.
{% endhint %}



