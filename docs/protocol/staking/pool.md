---
description: A fluid staking pool which rewards a different token than is staked
---

# Pool

## Contract

[Pool.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pool/Pool.sol) implements [IPool](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pool/IPool.sol), [ERC20](https://docs.openzeppelin.com/contracts/3.x/api/token/erc20#ERC20), [Timed](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/utils/Timed.sol)

## Description

The pool contract should take an initial reward token deposit _R_ and release to a staked token _S_ over time. _R_ and _S_ should be different tokens. Staking should be completely fluid and reward the user with R based on the time weighted S deployed in the pool. A staked deposit of size _s_ should earn the token release proportional to the size of _s_ relative to the total amount staked _S_ at time _t_.

## Implementation

Accounts can claim, deposit, or withdraw on behalf of another with approval. Required approvals:

* `claim` - Pool tokens
* `deposit` - Staked tokens
* `withdraw` - Pool tokens

Any withdrawn tokens \(staked or reward\) can be routed to a different destination address as well.

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

```javascript
function rewardToken() external view returns (IERC20);

function totalReward() external view returns (uint256);

function redeemableReward(address account)
    external
    view
    returns (uint256 amountReward, uint256 amountPool);

function releasedReward() external view returns (uint256);

function unreleasedReward() external view returns (uint256);

function rewardBalance() external view returns (uint256);

function claimedRewards() external view returns (uint256);

function stakedToken() external view returns (IERC20);

function totalStaked() external view returns (uint256);

function stakedBalance(address account) external view returns (uint256);
```

## State-Changing Functions <a id="state-changing-functions"></a>

### Public

```javascript
function claim(address from, address to) external returns (uint256);

function deposit(address to, uint256 amount) external;

function withdraw(address to)
    external
    returns (uint256 amountStaked, uint256 amountReward);

function init() external;
```

