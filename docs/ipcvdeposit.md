# IPCVDeposit

## Interface

[IPCVDeposit.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pcv/IPCVDeposit.sol)

## Events

`Deposit(address indexed _from, uint _amount)` - Deposit to the PCV

* `_from` - address of the depositor
* `_amount` - amount deposited

`Withdrawal(address indexed _caller, address indexed _to, uint _amount)` - Withdrawal of PCV

* `_caller` - the PCV controller calling this function
* `_to` - the recipient address of the PCV
* `_amount` - amount withdrawn

## Description

A PCV Deposit contract for storing Protocol Controlled Value. See the contract commented documentation for a description of the API.

