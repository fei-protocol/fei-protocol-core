---
description: A Pool for staking FEI/TRIBE Uniswap v2 LP tokens
---

# FeiStakingRewards

## Contract

[FeiStakingRewards](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/staking/FeiStakingRewards.sol) implements [StakingRewardsV2](https://github.com/SetProtocol/index-coop-contracts/blob/master/contracts/staking/StakingRewardsV2.sol)

## Events

{% tabs %}
{% tab title="RewardAdded" %}
Amount of reward token added to contract

| type | param | description |
| :--- | :--- | :--- |
| uint256 | reward | account of rewards sent to the contract |
{% endtab %}

{% tab title="Staked" %}
Tokens staked by user

| type | param | description |
| :--- | :--- | :--- |
| address indexed | user | account staked to |
| uint256 | amount | amount staked |
{% endtab %}

{% tab title="Withdrawn" %}
Staked tokens withdrawn by user

| type | param | description |
| :--- | :--- | :--- |
| address indexed | user | account withdrawn from |
| uint256 | amount | amount withdrawn |
{% endtab %}

{% tab title="RewardPaid" %}
Rewards redeemed by user

| type | param | description |
| :--- | :--- | :--- |
| address indexed | user | account receiving rewards |
| uint256 | reward | amount of reward |
{% endtab %}

{% tab title="Recovered" %}
ERC20 recovered by the distributor

| type | param | description |
| :--- | :--- | :--- |
| address indexed | tokenAddress | ERC-20 address |
| address indexed | to | destination for tokens |
| uint256 | amount | amount recovered |
{% endtab %}
{% endtabs %}

## Functions

Documented on the Synthetix website:

{% embed url="https://docs.synthetix.io/contracts/source/contracts/StakingRewards/" %}

