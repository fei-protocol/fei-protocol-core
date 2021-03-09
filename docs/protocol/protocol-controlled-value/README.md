---
description: 'The protocol-owned, algorithmic reserve of Fei Protocol'
---

# Protocol Controlled Value

Protocol Controlled Value ****\(PCV\) is a categorization of Total Value Locked \(TVL\) which represents all assets that are ultimately not redeemable by users. Commonly used examples of PCV are DAO treasuries and insurance funds. PCV can be conceptually extended to include any algorithmic management of the protocol-owned assets in order to facilitate protocol goals such as liquidity and stability.

## PCV Funding

Generally, there are two ways for a protocol to fund PCV:

1. Fees for functionality
   * e.g., Compound and Aave insurance pools funded by a spread on borrowing interest rates
2. Issuing a token
   * e.g., NXM token issuance, or other governance tokens in which the protocol holds some as a DAO treasury

The Fei Protocol primarily funds PCV via bonding curve FEI issuance. The bonding curve mints FEI in exchange for PCV at an oracle determined ETH exchange rate. It escrows this PCV until a [keeper \(Section 5.1.1\)](https://poseidon01.ssrn.com/delivery.php?ID=060100116086004030118084082100069076000050041076022024096096091109098084118079066127048021127015040030058021017029014085117099126094082050028023031001015125025056007031006064108004098114080124120108076106001015116100103012116119004083069093022026&EXT=pdf&INDEX=TRUE) allocates it to various _PCV Deposit_ contracts.

![](../../.gitbook/assets/bonding-curve-purchase.png)

{% page-ref page="../bondingcurve/" %}

## Generalized PCV

Fei Protocol is designed to support generalized Protocol Controlled Value. The protocol can fundraise PCV in any ERC-20 token by issuing a bonding curve denominated in that asset, contingent upon a reliable oracle to handle asset pricing.

_PCV Controllers_ manage PCV among the various PCV Deposits. Future Fei Protocol upgrades can algorithmically adjust PCV based on market conditions or include unique two-way integrations with other protocols. These integrations can leverage the utility tokens of other platforms or their functionality with other ERC-20 tokens held by the protocol.

