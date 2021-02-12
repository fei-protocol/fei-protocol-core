# ITimelockedDelegator

## Interface

[ITimelockedDelegator.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/dao/ITimelockedDelegator.sol)

## Events

`Delegate(address indexed _delegatee, uint _amount)` - delegate TRIBE tokens from timelock

* `_delegatee` - delegatee to recieve the TRIBE votes
* `_amount` - amount of TRIBE delegated

`Undelegate(address indexed _delegatee, uint _amount)` - Remove TRIBE votes from delegatee

* `_delegatee` - delegatee to remove TRIBE votes
* `_amount` - amount of TRIBE undelegated

## Description

Timelock for TRIBE tokens with subdelegation allowed. See the contract commented documentation for a description of the API.

