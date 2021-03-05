---
description: A fluid staking pool which rewards a different token than is staked
---

# Pool

## Contract

[Pool.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pool/Pool.sol) implements [IPool](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pool/IPool.sol), [ERC20](https://docs.openzeppelin.com/contracts/3.x/api/token/erc20#ERC20), [Timed](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/utils/Timed.sol)

## Description

The pool contract should take an initial reward token deposit _R_ and release to a staked token _S_ over time. _R_ and _S_ should be different tokens. Staking should be completely fluid and reward the user with R based on the time weighted S deployed in the pool.

## Events

{% tabs %}
{% tab title="Deposit" %}
Deposit tokens to earn rewards

| type | param | description |
| :--- | :--- | :--- |
| address indexed | \_from | account with the staked tokens deposited |
| address indexed | \_to | account receiving the ownership and rewards |
| uint256 | \_amountStaked | amount of staked token deposited |
{% endtab %}

{% tab title="Claim" %}
Claim rewards without withdrawing

| type | param | description |
| :--- | :--- | :--- |
| address indexed | \_from | account with the staked balances and rewards claimed from |
| address indexed | \_to | account rewards sent to |
| uint256 | \_amountReward | amount of reward token claimed |
{% endtab %}

{% tab title="Withdraw" %}
Claim rewards and withdraw staked

| type | param | description |
| :--- | :--- | :--- |
| address indexed | \_from | account with the staked tokens and rewards withdrawn |
| address indexed | \_to | account receiving the staked tokens and rewards |
| uint256 | \_amountStaked | amount staked withdrawn |
| uint256 | \_amountReward | amount reward earned |
{% endtab %}
{% endtabs %}

## Read-Only Functions

### rewardToken

```javascript
function rewardToken() external view returns (IERC20);
```

Returns the address of the reward token as an interface.

### totalReward

```javascript
function totalReward() external view returns (uint256);
```

Returns the total amount of rewards released over the entire window, including claimed, released, and unreleased.

### redeemableReward

```javascript
function redeemableReward(address account)
    external
    view
    returns (uint256 amountReward, uint256 amountPool);
```

Returns the total `amountReward` of claimable `rewardToken` for address `account`, as well as the `amountPool` of Pool ERC-20 tokens that correspond and are redeemable.

### releasedReward

```javascript
function releasedReward() external view returns (uint256);
```

Return the amount of `rewardToken` available for claiming by the pool. Calculated as `rewardBalance() - unreleasedReward()`.

### unreleasedReward

```javascript
function unreleasedReward() external view returns (uint256);
```

The abstract unreleased reward function which can be customized for each implementation. Intuitively it should start at the `totalReward()` amount and then wind down to 0 over the `duration` of the window.

### rewardBalance

```javascript
function rewardBalance() external view returns (uint256);
```

The amount of `rewardToken` held by the contract, released or unreleased.

### claimedRewards

```javascript
function claimedRewards() external view returns (uint256);
```

The total amount of `rewardToken` already claimed by the Pool.

### stakedToken

```javascript
function stakedToken() external view returns (IERC20);
```

The address of the staked ERC20 token as an interface

### totalStaked

```javascript
function totalStaked() external view returns (uint256);
```

The total amount of `stakedToken` held in the contract by depositors.

### stakedBalance

```javascript
function stakedBalance(address account) external view returns (uint256);
```

Returns the amount of `stakedToken` deposited in the contract by `account`

## State-Changing Functions <a id="state-changing-functions"></a>

### Public

#### deposit

```javascript
function deposit(address to, uint256 amount) external;
```

Deposits `amount` of the `stakedToken` and gives ownership and the Pool ERC-20 token to address `to`.

emits `Deposit`

#### claim

```javascript
function claim(address from, address to) external returns (uint256);
```

Claims available rewards from address `from` to address `to`. Claimable by an approved operator contract for the Pool ERC-20.

emits `Claim`

#### withdraw

```javascript
function withdraw(address to)
    external
    returns (uint256 amountStaked, uint256 amountReward);
```

Withdraws `amountStaked` of `stakedToken` and `amountReward` of `rewardToken` to address `to` based on the the Pool ERC-20 and staked balances of `msg.sender`

emits `Withdraw`

#### init

```javascript
function init() external;
```

Starts the [Timed](../references/timed.md) for the reward release calculation. Only callable once.

