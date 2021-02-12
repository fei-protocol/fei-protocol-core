# Pool

## Contract

[Pool.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pool/Pool.sol) implements [IPool](https://github.com/fei-protocol/fei-protocol-core/wiki/IPool), [ERC20](https://docs.openzeppelin.com/contracts/3.x/api/token/erc20#ERC20), [ERC20Burnable](https://docs.openzeppelin.com/contracts/3.x/api/token/erc20#ERC20Burnable), [Timed](https://github.com/fei-protocol/fei-protocol-core/wiki/Timed)

## Description

The pool contract should take an initial reward token deposit _R_ and release to a staked token _S_ over time. _R_ and _S_ should be different tokens. Staking should be completely fluid and reward the user with R based on the time weighted S deployed in the pool. A staked deposit of size _s_ should earn the token release proportional to the size of _s_ relative to the total amount staked _S_ at time _t_.

## Events

`Claim(address indexed _from, address indexed _to, uint _amountReward)` - Claim rewards without withdrawing

* `_from` - account with the staked balances and rewards claimed from
* `_to` - account rewards sent to
* `_amountReward` - amount of reward token claimed

`Deposit(address indexed _from, address indexed _to, uint _amountStaked)` - Deposit tokens to earn rewards

* `_from` - account with the staked tokens deposited
* `_to` - account receiving the ownership and rewards
* `_amountStaked` - amount of staked token deposited

`Withdraw(address indexed _from, address indexed _to, uint _amountStaked, uint _amountReward)` - Claim rewards and withdraw staked

* `_from` - account with the staked tokens and rewards withdrawn
* `_to` - account receiving the staked tokens and rewards
* `_amountStaked` - amount staked withdrawn
* `_amountReward` - amount reward earned

## Architecture

We achieve this using the following schema:

* _R_ - total reward over entire period. Could go up or down via governance.
* _S_ - total staked \(with lower case meaning single user\). Could go up or down via user activity
* _d_ - the total duration of the R release
* _t_ - the timestamp on range \[0,_d_\] from initialization 
* _U\(t\)_ - the amount of unreleased reward tokens by a given time _t_. Should be zero at time _d_
* _C_ - the amount of R already claimed via the pool
* _TWFB\(s\) = s\(d - t\)_ - the time weighted final balance of a staked amount _s_. This should represent "how many staked-seconds" of the balance until the end of the window assuming the assets stay in until _d_

When a user deposits they are issued a fungible ERC20 pool token "POOL" via _P\(s\) = TWFB\(s\)_. Their staked balance _s_ is also stored in a map. When a user wishes to redeem their POOL for released _R_ the following calculations are performed:

* _R - C - U\(t\)_ - amount of claimable _R_
* _totalSupply\(POOL\) - TWFB\(S\)_ - total redeemable POOL \(subtracting the TWFB of yet to come _R_ distributions\)
* _balanceOf\(POOL\) - TWFB\(s\)_ - user redeemable POOL \(subtracting the TWFB of yet to come _R_ distributions\)

The user will receive back their initial _s_ deposit along with the pro-rata share in claimable _R_ per TWFB adjusted POOL. Claimed _C_ should be incremented by this number.

Regarding this schema it should be the case that: 1. All rewards take into account time and volume in the pool proportionally when determining ownership of released _R_ 2. Assuming _R_ is claimed continuously, this model achieves the desired property of fluidity and time weighted ownership 3. Any new supply "dilutes" ownership in unclaimed _R_ over time but not immediately 4. Transfers of POOL should update the staked balances _s_ pro-rata

## Implementation

Accounts can claim, deposit, or withdraw on behalf of another with approval. Required approvals:

* `claim` - Pool tokens
* `deposit` - Staked tokens
* `withdraw` - Pool tokens

Any withdrawn tokens \(staked or reward\) can be routed to a different destination address as well.

