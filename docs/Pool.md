## Contract
[Pool.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pool/Pool.sol)
implements [IPool](https://github.com/fei-protocol/fei-protocol-core/wiki/IPool), [ERC20](https://docs.openzeppelin.com/contracts/3.x/api/token/erc20#ERC20), [ERC20Burnable](https://docs.openzeppelin.com/contracts/3.x/api/token/erc20#ERC20Burnable), [Timed](https://github.com/fei-protocol/fei-protocol-core/wiki/Timed)


## Description
The pool contract should take an initial reward token deposit *R* and release to a staked token *S* over time. *R* and *S* should be different tokens. Staking should be completely fluid and reward the user with R based on the time weighted S deployed in the pool. A staked deposit of size *s* should earn the token release proportional to the size of *s* relative to the total amount staked *S* at time *t*.

## Architecture
We achieve this using the following schema:
  * *R* - total reward over entire period. Could go up or down via governance.
  * *S* - total staked (with lower case meaning single user). Could go up or down via user activity
  * *d* - the total duration of the R release
  * *t* - the timestamp on range [0,*d*] from initialization 
  * *U(t)* - the amount of unreleased reward tokens by a given time *t*. Should be zero at time *d*
  * *C* - the amount of R already claimed via the pool
  * *TWFB(s) = s(d - t)* - the time weighted final balance of a staked amount *s*. This should represent "how many staked-seconds" of the balance until the end of the window assuming the assets stay in until *d*

When a user deposits they are issued a fungible ERC20 pool token "POOL" via *P(s) = TWFB(s)*. Their staked balance *s* is also stored in a map. 
When a user wishes to redeem their POOL for released *R* the following calculations are performed:
  * *R - C - U(t)* - amount of claimable *R*
  * *totalSupply(POOL) - TWFB(S)* - total redeemable POOL (subtracting the TWFB of yet to come *R* distributions)
  * *balanceOf(POOL) - TWFB(s)* - user redeemable POOL (subtracting the TWFB of yet to come *R* distributions)

The user will receive back their initial *s* deposit along with the pro-rata share in claimable *R* per TWFB adjusted POOL. Claimed *C* should be incremented by this number.

Regarding this schema it should be the case that: 
1. All rewards take into account time and volume in the pool proportionally when determining ownership of released *R*
2. Assuming *R* is claimed continuously, this model achieves the desired property of fluidity and time weighted ownership
3. Any new supply "dilutes" ownership in unclaimed *R* over time but not immediately
4. Transfers of POOL should update the staked balances *s* pro-rata

## Implementation
Accounts can claim, deposit, or withdraw on behalf of another with approval.
Required approvals:
* `claim` - Pool tokens
* `deposit` - Staked tokens
* `withdraw` - Pool tokens

Any withdrawn tokens (staked or reward) can be routed to a different destination address as well.
