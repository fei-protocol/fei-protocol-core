---
description: "The equal opportunity launch of Fei Protocol \U0001F680"
---

# Genesis

Fei Protocol Genesis starts at 0:00 UTC on March 4, 2021. It lasts for 3 days, ending March 7, 2021. Read the Medium announcement for more high level details around Genesis:

&lt;Link to medium announcement&gt;

## Genesis Group

The Genesis Group contract is the entry point for users for participating in Genesis. It provides users the ability to:

* Purchase entry for ETH
* Pre-commit Genesis FEI to purchase on the IDO
* Launch Fei Protocol
* Redeem rewards after launch
* Emergency exit if the launch fails

{% hint style="warning" %}
Genesis entry is one-way. There is no way to redeem Genesis ETH for ETH, unless the launch fails.

Likewise pre-commitment is one-way, no way to revert back to uncommitted Genesis ETH.
{% endhint %}

{% page-ref page="genesisgroup.md" %}

## Initial DEX Offering \(IDO\)

As part of the Genesis launch, Fei Protocol will list [FEI](../fei-stablecoin/) and [TRIBE](../../governance/tribe.md) on Uniswap. This will amount to 20% of the [TRIBE initial token distribution](https://medium.com/fei-protocol/the-tribe-token-distribution-887f26169e44). The liquidity for this IDO will be timelocked and owned by the Fei Core Team. See the section below for more details on the token timelocks.

{% page-ref page="ido.md" %}

{% page-ref page="../references/lineartokentimelock.md" %}

## Fei Core Team Timelocks

The Fei Core Team and investors will own timelocked [TRIBE](../../governance/tribe.md) as well as the LP tokens associated with the IDO. These timelocks follow a linear release schedule over a 4 year window on the contract level. The Fei Core Team has elected to vest over 5 years, backweighted, however this vesting will be managed on the company level and not the contract level.

The TRIBE will be held in a special timelock called the TimelockedDelegator which allows for sub-delegation of portions of the team's tokens. If you'd like to be considered as a sponsored delegate, reach out on Discord.

{% page-ref page="timelockeddelegator.md" %}

{% page-ref page="../references/lineartokentimelock.md" %}



