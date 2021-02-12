## Interface
[IUniswapIncentive.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/token/IUniswapIncentive.sol) implements [IIncentive](https://github.com/fei-protocol/fei-protocol-core/wiki/IIncentive)

## Events
`TimeWeightUpdate(uint _weight, bool _active)` - Time Weight change
* `_weight` - new time weight
* `_active` - whether time weight is growing or not

`GrowthRateUpdate(uint _growthRate)` - Governance change of time weight growth weight
* `_growthRate` - new growth rate

`ExemptAddressUpdate(address indexed _account, bool _isExempt)` - Governance change of an exempt address
* `_account` - the address to update
* `_isExempt` - whether the account is exempt or not

## Description
Uniswap Incentive contract for FEI token. See the contract commented documentation for a description of the API.