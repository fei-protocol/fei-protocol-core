# IUniswapPCVController

## Interface

[IUniswapPCVController.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pcv/IUniswapPCVController.sol)

## Events

`Reweight(address indexed _caller)` - A Uniswap Reweight event

* `_caller` - the address triggering the reweight

`PCVDepositUpdate(address indexed _pcvDeposit)` - Change the PCV Deposit contract

* `_pcvDeposit` - new pcv deposit contract

`ReweightIncentiveUpdate(uint _amount)` - Change the FEI reward for reweighting

* `_amount` - FEI reward amount

`ReweightMinDistanceUpdate(uint _basisPoints)` - Change the min distance for a reweight

* `_basisPoints` - Minimum reweight amount in basis points \(i.e. 1/10000\)

## Description

A PCV Controller contract for adjusting PCV stored in a Uniswap PCV Deposit. See the contract commented documentation for a description of the API.

