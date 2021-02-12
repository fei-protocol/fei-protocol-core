# Timed

## Contract

[Timed.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/utils/Timed.sol)

## Description

Abstract contract for managing timed events that complete after a period

## Implementation

The contract has a duration _d_ denominated in seconds. It has an effective timestamp _t_ on the range \[0,d\]. After the period has ended, _t_ stays fixed at _d_.

When it is initialized, it sets the current block timestamp to _t=0_. The remaining time is _d-t_ and the completion condition is remaining = 0 \(_t=d_\).

