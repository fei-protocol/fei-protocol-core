# IOracle

## Interface

[IOracle.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/oracle/IOracle.sol)

## Events

`KillSwitchUpdate(uint _killSwitch)` - Oracle kill switch change

* `_killSwitch` - new value of the kill switch flag

`Update(uint _peg)` - new reported peg

* `_peg` - new peg value

## Description

Generic oracle interface for FEI protocol. See the contract commented documentation for a description of the API.

