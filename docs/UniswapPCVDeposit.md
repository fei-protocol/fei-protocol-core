## Contract
[UniswapPCVDeposit.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pcv/UniswapPCVDeposit.sol)
implements [IPCVDeposit](https://github.com/fei-protocol/fei-protocol-core/wiki/IPCVDeposit),  [UniRef](https://github.com/fei-protocol/fei-protocol-core/wiki/UniRef)

## Description
An abstract contract for storing PCV in a Uniswap FEI liquidity pair 

## [Permissions](https://github.com/fei-protocol/fei-protocol-core/wiki/Permissions)
* Minter

## Implementation
Uniswap PCV deposits should be able to receive PCV, mint the corresponding amount of FEI to match spot, and deposit to Uniswap. They should also be able to withdraw and read in the amount of non-fei PCV on unsiwap held in the contract.

When withdrawing, any excess fei held should be burned

When depositing, if no existing LP exists then the oracle price should be used. The oracle should be a [BondingCurveOracle](https://github.com/fei-protocol/fei-protocol-core/wiki/BondingCurveOracle) subject to thawing and the bonding curve price.