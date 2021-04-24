---
description: How to Delegate Your Voting Power
---

# Delegate Votes

Before getting started, ensure that you have connected your wallet. 

You can delegate votes to yourself or to another address. 

{% hint style="warning" %}
Note that tokens you own are not active for voting until you delegate. **You must delegate to yourself if you wish to vote on proposals directly with your own tokens.**
{% endhint %}

First, navigate to the Fei Protocol governance page: [https://www.withtally.com/governance/fei](https://www.withtally.com/governance/fei). 

## Delegate to yourself \(set up wallet for direct voting\):

Click on the button to "delegate to self".

![](../../.gitbook/assets/image%20%287%29.png)

Select "direct delegation", and then click the "delegate" button.

![](../../.gitbook/assets/image%20%281%29.png)

![](../../.gitbook/assets/image%20%2810%29.png)

Confirm and sign the transaction via Metamask.

![](../../.gitbook/assets/image.png)

## Delegate votes to another address:

Navigate to the delegate leaderboard at the bottom of the Fei Protocol [governance](https://www.withtally.com/governance/fei) page. If your preferred delegate is not in the top 10 addresses by voting power, click on the "view all" link to view additional delegates.

![](../../.gitbook/assets/image%20%2815%29.png)

Click on the address you'd like to support to view their voter page. Then click on the "delegate vote" button on the right hand side.

![](../../.gitbook/assets/image%20%2811%29.png)

Select "direct delegation", and then click the "delegate" button.

![](../../.gitbook/assets/image%20%2812%29.png)

![](../../.gitbook/assets/image%20%283%29.png)

Confirm and sign the transaction via Metamask.

![](../../.gitbook/assets/image%20%2818%29.png)

## Delegate votes by signature:

Delegation by signature allows you to delegate your votes to another address, and let a third party, such as the individual receiving your votes, pay for submitting the delegation transaction on chain. 

{% hint style="warning" %}
Currently, it's not possible to delegate by signature using a hardware wallet device. This is due to device providers not yet supporting EIP 712 message signing.
{% endhint %}

Navigate to the delegate leaderboard at the bottom of the Fei Protocol governance page. If your preferred delegate is not in the top 10 addresses by voting power, click on the "view all" link to see additional delegates.

![](../../.gitbook/assets/image%20%288%29.png)

Click on the address you'd like to support to view their voter page. Then click on the "delegate vote" button on the right hand side.

![](../../.gitbook/assets/image%20%2817%29.png)

Select "delegation by signature", and then click the "create new signature" button.

![](../../.gitbook/assets/image%20%282%29.png)

Confirm and sign the message via Metamask. 

![](../../.gitbook/assets/image%20%2816%29.png)

You will now see the message hash in the "generated signature" field. 

![](../../.gitbook/assets/image%20%289%29.png)

Choosing to "send transaction to network" will simply submit your delegation as an on-chain transaction, and you must pay for gas yourself - this is equivalent to regular delegation transactions. 

If your chosen delegate has opted in, you can select the option to "send signature to protocol advocate", and the receiving delegate address will pay transaction fees on your behalf.

## Confirm your delegation status:

Start by navigating to your address's voter page. If you are among the top 100 addresses by voting power, you can link to your voter page through the "top voters" table at the bottom of the governance page. Alternatively, you can view your address's voter page by pasting the following link into your browser with the relevant details.

[`https://www.withtally.com/voter/[your ethereum address]/governance/fei`](https://www.withtally.com/voter/0x66b9d411e14fbc86424367b67933945fd7e40b11/governance/fei)\`\`

Once you've accessed your voter page, review the "delegating to" section on the right hand side. If you delegated votes to yourself \(set up your address for direct voting\), you should see "self delegation".

![](../../.gitbook/assets/image%20%285%29.png)

If you delegated votes to another address, this section will display a link to that address's voter page.

![](../../.gitbook/assets/image%20%2819%29.png)

Note that if you delegated by signature, this update will not be reflected until the receiving delegate address submits your signature as an on-chain transaction.

