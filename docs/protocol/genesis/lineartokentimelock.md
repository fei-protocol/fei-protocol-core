# LinearTokenTimelock

## Contract

[LinearTokenTimelock.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/utils/LinearTokenTimelock.sol) implements [Timed](https://github.com/fei-protocol/fei-protocol-core/wiki/Timed)

## Description

A timelock for releasing tokens over a continuous linear schedule.

## Implementation

Uses [Timed](https://github.com/fei-protocol/fei-protocol-core/wiki/Timed) to have a fixed period _d_ of release. _t_ is the timestamp on \[0,d\].

There is an appointed beneficary who received the tokens when vested. The beneficiary can set the new one if needed using the offer accept pattern.

The contract maintains the following:

* `T` - a total token amount which includes any released and locked tokens. It can increase if new tokens enter the timelock but it cannot decrease.
* `C` - the current held tokens in the contract

The portion of _T_ available for release is _Tt/d_.

The already released amount is _T - C_.

The net amount available for release is the total available minus already released. The beneficiary can claim these at any time.

## Read-Only Functions

## State-Changing Functions <a id="state-changing-functions"></a>

### Governor-Only 

### GenesisGroup-Only

