## Contract
[Timed.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/utils/Timed.sol)

## Description
Abstract contract for managing timed events that complete after a period

## Implementation
The contract has a duration *d* denominated in seconds. It has an effective timestamp *t* on the range [0,d]. After the period has ended, *t* stays fixed at *d*.

When it is initialized, it sets the current block timestamp to *t=0*. The remaining time is *d-t* and the completion condition is remaining = 0 (*t=d*).