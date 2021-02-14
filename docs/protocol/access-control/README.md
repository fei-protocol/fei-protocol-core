---
description: The Core access control module to Fei Protocol
---

# Access Control

Fei Protocol uses access control to define which contracts in the system have what responsibilities.

The following roles exist within the system:

* Governor ⚖️
* Minter 💰
* Burner 🔥
* PCV Controller ⚙️
* Guardian 🛡️

The Fei Core contract is responsible for managing access control, as well

{% page-ref page="core.md" %}



### Governor ⚖️

The Governor role is the most powerful role in Fei Protocol. It is capable of granting and revoking any other role. It can also update many protocol parameters unique to each contract. This include bonding curve targets, incentive formulas, oracle windows and more.

While the role technically belongs to the Timelock, it is useful to think primarily of the [Fei DAO](../../governance/fei-dao.md) as the only Governor at launch, as the Fei DAO is the admin of the Timelock.

Having Governor be a role and not a single contract allows Fei Protocol to have flexibility in appointing automated governance contracts or having different tiers of governance with varying degrees of difficulty for execution criteria.

{% page-ref page="../../governance/fei-dao.md" %}

### Minter 💰 

Minters are able to create [Fei USD](../fei-stablecoin/fei-fei-usd.md) and add it to any address. This can be a reward for an action like supporting the peg, or it could be an issuance mechanism for funding [PCV](../protocol-controlled-value/) on a bonding curve.

Some example Minters:

{% page-ref page="../protocol-controlled-value/ethuniswappcvdeposit.md" %}

{% page-ref page="../bondingcurve/ethbondingcurve.md" %}

### Burner 🔥

Burners are able to remove portions of [Fei USD](../fei-stablecoin/fei-fei-usd.md) from any address. This would generally happen as a penalty for an action like hurting the peg.

An example Burner:

{% page-ref page="../fei-stablecoin/uniswapincentive.md" %}

### PCV Controller ⚙️

PCV Controllers are able to move [PCV](../protocol-controlled-value/) from any contract and redeploy it elsewhere. This is done to reweight the peg, facilitate integrations, or protect against adverse conditions.

An example PCV Controller:

{% page-ref page="../protocol-controlled-value/ethuniswappcvcontroller.md" %}

### Guardian 🛡️

The Guardian role maintains the ability to revoke any role from any of the above role types. It can also adjust and shut off some other protocol parameters. It cannot manage PCV or mint FEI. The intention behind having this role is to allow for quick feature shutdowns in the event of an unforseen bug or issue. 

{% page-ref page="../../governance/fei-guardian.md" %}









