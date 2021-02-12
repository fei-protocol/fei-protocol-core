# ICore

## Interface

[ICore.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/core/ICore.sol)

## Events

`FeiUpdate(address indexed _fei)` - Governance change of FEI token address

* `_fei` - new FEI address

`TribeAllocation(address indexed _to, uint _amount)` - Governance deployment of TRIBE tokens from treasury

* `_to` - recipient of TRIBE tokens
* `_amount` - amount of TRIBE tokens

`GenesisPeriodComplete(uint _timestamp)` - Signals completion of Genesis Period and full launch of FEI protocol

* `_timestamp` - block timestamp of Genesis Completion

## Description

Source of truth for Fei Protocol. See the contract commented documentation for a description of the API.

