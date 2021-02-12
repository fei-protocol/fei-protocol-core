# TimelockedDelegator

## Contract

[TimelockedDelegator.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/dao/TimelockedDelegator.sol) implements [ITimelockedDelegator](https://github.com/fei-protocol/fei-protocol-core/wiki/ITimelockedDelegator), [LinearTokenTimelock](https://github.com/fei-protocol/fei-protocol-core/wiki/LinearTokenTimelock)

## Events

`Delegate(address indexed _delegatee, uint _amount)` - delegate TRIBE tokens from timelock

* `_delegatee` - delegatee to recieve the TRIBE votes
* `_amount` - amount of TRIBE delegated

`Undelegate(address indexed _delegatee, uint _amount)` - Remove TRIBE votes from delegatee

* `_delegatee` - delegatee to remove TRIBE votes
* `_amount` - amount of TRIBE undelegated

## Description

A token timelock for TRIBE which allows for subdelegation.

## Implementation

The contract should receive TRIBE tokens that vest linearly over a 4 year schedule to a beneficiary. During this period, any TRIBE held in the timelock can be sub delegated to any address. The beneficiary decides where to delegate and undelegate. All TRIBE held in the timelock that is not sub delegated is delegated to the beneficiary.

