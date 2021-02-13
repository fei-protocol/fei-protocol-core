---
description: The Decentralized Autonomous Organization driving Fei Protocol upgrades
---

# Fei DAO

A core principle of Fei Protocol is its fully decentralized design and minimal dependence on any centralized assets or protocols on Ethereum. Fei Protocol has a DAO called the Fei DAO from the very beginning. This DAO is responsible for utilizing all of the flexible and powerful features of Fei Protocol to continue to enhance the protocol in an ever evolving DeFi space. 

## Responsibilities

A key benefit of Fei Protocol's design is the minimization of governance for peg maintenance related activities. Aside from some inevitable tuning that will be needed in the early days, the Fei DAO is primarily responsible for two things: upgrades and integrations.

Here is a list of various parameter tunings and changes that the Fei DAO can make:

* grant/revoke [roles](../protocol/access-control/)
* add/remove incentive contracts for [FEI](../protocol/fei-stablecoin/)
* allowlist addresses for selling on the incentivized exchange or exempt from direct incentives
* Set incentive growth rate
* upgrade FEI or TRIBE
* change [PCV](../protocol/protocol-controlled-value/) allocations
* update [bonding curve](../protocol/trading/bondingcurve/bondingcurve.md) buffer and Scale target
* adjust rewards from the [staking pool](../protocol/staking/)
* upgrade oracles and other contracts throughout the system

## Design

The Fei DAO is forked from the Compound [Governor Alpha](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/dao/GovernorAlpha.sol) and [Timelock](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/dao/Timelock.sol). They have the following parameter tweaks from Compound:

* 2.5% Quorum
* .25% proposal threshold
* 12 hour voting delay \(3333 blocks\)
* 36 hour voting period \(10000 blocks\)
* 24 hour timelock delay
* Instead of the COMP token, the Fei DAO is controlled by [TRIBE](tribe.md)

{% embed url="https://www.diffchecker.com/x7AJ999N" caption="Fei DAO vs Compound DAO" %}

A nice feature of Fei Protocol is the flexible [access control](../protocol/access-control/) system. The Timelock is appointed as a Governor⚖️, but it doesn't have to be the only one. It also doesn't have to be a Governor forever. Fei Protocol can appoint autonomous governors to adjust parameters and [PCV](../protocol/protocol-controlled-value/) based on market conditions. There can even be a tiered governance structure where certain changes require higher quorum thresholds and longer timelocks.

Ultimately the Fei DAO gets to make all of these decisions as the protocol evolves.



