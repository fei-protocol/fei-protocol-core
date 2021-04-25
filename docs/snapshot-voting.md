---
description: How to signal support of proposals
---

# Snapshot Voting

## What are Snapshot votes?

Snapshot voting is a way to vote off-chain without spending any ETH to signal support for a given proposal or path forward for a DAO vote.

{% hint style="warning" %}
Snapshot votes are NOT binding, all on-chain proposals must pass through the [Fei DAO](governance/fei-dao.md)
{% endhint %}

Snapshot votes can calculate voting power at a certain point in time \(block\) and customized token balances, including delegations or tokens held in staked LP tokens, for example.

## How to Vote

1. Head to [https://snapshot.fei.money/\#/](https://snapshot.fei.money/#/)
2. Click on “**Connect wallet**” button in top right corner.
3. Connect with wallet provider where you hold TRIBE and/or FEI-TRIBE staked LP tokens
4. Select the active proposal you wish to vote on
5. After reading the proposal, select your preferred choice and "vote"
6. Your wallet will prompt you to sign a message, this does not cost any ETH and will submit your vote.

## How Voting weight is calculated

Voting weight is equal to the sum of your delegated, held, and staked TRIBE.

For held TRIBE, if it is delegated, then it is not double-counted. The contract used to determine delegated + held balances is [here](https://etherscan.io/address/0x1165a505e8c4e82b7b98e77374c789dbd7b53f9a#code). For staked FEI-TRIBE LP, only the TRIBE portion is counted and the unclaimed TRIBE does not count.

## How to make a proposal

Anyone can make a proposal if their voting weight is more than 1000 TRIBE.

Simply follow the snapshot guidelines to do so: [https://docs.snapshot.org/proposals/create](https://docs.snapshot.org/proposals/create)



