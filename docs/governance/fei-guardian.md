---
description: "The guardian to halt Fei Protocol functionality in a crisis\U0001F6E1"
---

# Fei Guardian

The Fei Guardian is the single address to be granted the Guardian🛡 \(a.k.a. "Revoker"\) role at Genesis. This will be initially held by the Fei Core Team in a multi-sig, with the intention of either renouncing the role or transitioning to a community held multi-sig within a few months of launch.

The rational behind having a Guardian is that there can be issues in the protocol which are time sensitive. The minimum 3 day window between proposal and execution for a fix coming through the [Fei DAO](fei-dao.md) is not fast enough. For instance if there is a bug in the incentive calculation where an attacker can systematically make a profit, this functionality should be shut down as quickly as possible. The Guardian would step in and revoke the Minter💰role from the [UniswapIncentive](../protocol/fei-stablecoin/uniswapincentive.md) contract.

## Responsibilities

* revoke any role from any contract, except Governor⚖️
* adjust bonding curve buffer
* adjust oracle duration or kill switch
* force a reweight or adjust reweight minimum distance
* allow and block addresses from transferring to the ETH/FEI pair
* Adjust incentive growth rate

