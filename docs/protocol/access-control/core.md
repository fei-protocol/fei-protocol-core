# Core

## Contract

[Core.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/core/Core.sol) implements [ICore](https://github.com/fei-protocol/fei-protocol-core/wiki/ICore), [Permissions](https://github.com/fei-protocol/fei-protocol-core/wiki/Permissions)

## [Permissions](https://github.com/fei-protocol/fei-protocol-core/wiki/Permissions)

* Governor

## Events

`FeiUpdate(address indexed _fei)` - Governance change of FEI token address

* `_fei` - new FEI address

`TribeAllocation(address indexed _to, uint _amount)` - Governance deployment of TRIBE tokens from treasury

* `_to` - recipient of TRIBE tokens
* `_amount` - amount of TRIBE tokens

`GenesisPeriodComplete(uint _timestamp)` - Signals completion of Genesis Period and full launch of FEI protocol

* `_timestamp` - block timestamp of Genesis Completion

## Description

The Core contract is responsible for a few things:

* Access control \(See [Permissions](https://github.com/fei-protocol/fei-protocol-core/wiki/Permissions)\)
* Pointing to [FEI](https://github.com/fei-protocol/fei-protocol-core/wiki/FEI), [TRIBE](https://github.com/fei-protocol/fei-protocol-core/wiki/TRIBE), and [GenesisGroup](https://github.com/fei-protocol/fei-protocol-core/wiki/GenesisGroup) contracts
* Determines when Genesis Period is over
* Governance treasury of TRIBE

All other Fei Protocol contracts should refer to Core by implementing the CoreRef contract.

## Implementation

When Core is constructed it does the following:

* Set sender as governor
* Create and reference FEI and TRIBE contracts

The governor is expected to set the genesis group contract.

When the genesis group conditions are met, the GenesisGroup contract should complete the genesis group by calling Core `completeGenesisGroup`

