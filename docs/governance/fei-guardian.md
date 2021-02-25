---
description: "The guardian to halt Fei Protocol functionality in a crisis\U0001F6E1"
---

# Fei Guardian

The Fei Guardian is the single address to be granted the Guardian🛡role at Genesis. This will be initially held by the Fei Core Team in a multi-sig, with the intention of either renouncing the role or transitioning to a community held multi-sig within a few months of launch.

The rational behind having a Guardian is that there can be issues in the protocol which are time sensitive. The minimum 3 day window between proposal and execution for a fix coming through the [Fei DAO](fei-dao.md) is not fast enough. For instance if there is a bug in the incentive calculation where an attacker can systematically make a profit, this functionality should be shut down as quickly as possible. The Guardian would step in and revoke the Minter💰role from the [UniswapIncentive](../protocol/fei-stablecoin/uniswapincentive.md) contract.

The Guardian can only revoke or pause functionality, with the additional ability to force a reweight.

{% hint style="info" %}
The Governor⚖️ can revoke the Guardian🛡ability at any time
{% endhint %}

## Responsibilities

* revoke any role from any contract, except Governor⚖️
* pause and unpause contracts
* force a reweight

## Pausability

Any contract implementing [CoreRef](../protocol/references/coreref.md) has the baked in ability to be pausable. Any external method marked as pausable would revert when the contract is in the paused state. Below is a list of pausable methods by contract:

### [EthBondingCurve](../protocol/bondingcurve/ethbondingcurve.md)

* `allocate()`
* `purchase(address to, uint256 amountIn)`

Pause would prevent both purchasing FEI and allocating PCV from the bonding curve

### [EthUniswapPCVDeposit](../protocol/protocol-controlled-value/ethuniswappcvdeposit.md)

* `deposit(uint256 ethAmount)`
* `withdraw(uint256 ethAmount)`

Pause would prevent new PCV from being provided as liquidity to Uniswap or withdrawn

### [EthUniswapPCVController](../protocol/protocol-controlled-value/ethuniswappcvcontroller.md)

* `reweight()`

Pause would prevent external actors from triggering reweights when the criteria are met.

{% hint style="info" %}
The `forceReweight()` function would still be available for the Guardian to manually support the peg
{% endhint %}

### [Fei](../protocol/fei-stablecoin/fei-fei-usd.md)

* `burnFrom()`
* `mint()`

Pause would render all Minter💰and Burner🔥contracts unable to mint and burn FEI, respectively

### [UniswapOracle](../protocol/oracles/uniswaporacle.md)

* `read()`
* `update()`

Pause would render all Fei Protocol contracts which rely on this oracle unable to successfully execute function calls

### [BondingCurveOracle](../protocol/oracles/bondingcurveoracle.md)

* `read()`

Pause would render all Fei Protocol contracts which rely on this oracle unable to successfully execute function calls

### [FeiRewardsDistributor](../protocol/staking/feirewardsdistributor.md)

* `drip()`

Pause would stop any future TRIBE reward distributions to [FeiStakingRewards](../protocol/staking/feistakingrewards.md) but leave the current reward cycle unchanged.



