## Contract
FeiRouter.sol implements [IFeiRouter](https://github.com/fei-protocol/fei-protocol-core/wiki/IFeiRouter), [UniswapSingleEthRouter](https://github.com/fei-protocol/fei-protocol-core/wiki/UniswapSingleEthRouter)

## Description
A router for swapping FEI and ETH

## Implementation
The router implements methods for buying and selling Fei using the UniswapSingleEthRouter with a single added parameter. 

For the `buyFei` method the `minReward` parameter is the minimum amount of FEI mint the contract should allow without reverting. This is the mint applied by the [UniswapIncentive](https://github.com/fei-protocol/fei-protocol-core/wiki/UniswapIncentive) contract.

For the `sellFei` method the `maxPenalty` parameter is the maximum amount of FEI burn the contract should allow without reverting. This is the burn applied by the [UniswapIncentive](https://github.com/fei-protocol/fei-protocol-core/wiki/UniswapIncentive) contract.