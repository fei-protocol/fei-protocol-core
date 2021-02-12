## Interface
[IPool.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pool/IPool.sol)

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

## Description
A fluid pool for earning a reward token with a staked token. See the contract commented documentation for a description of the API.
