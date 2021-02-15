---
description: A timer utility for keeping track of elapsed time within a window
---

# Timed

### Contract

[Timed.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/utils/Timed.sol)

### Description

Abstract contract for managing timed events that complete after a period

### Implementation

The contract has a duration _d_ denominated in seconds. It has an effective timestamp _t_ on the range \[0,d\]. After the period has ended, _t_ stays fixed at _d_.

When it is initialized, it sets the current block timestamp to _t=0_. The remaining time is _d-t_ and the completion condition is remaining = 0 \(_t=d_\).





```text
function isTimeEnded() public view returns (bool) {
```

```text
uint256 public startTime;
```

```text
uint256 public duration;
```

```text
function timeSinceStart() public view returns (uint256) {
```

```text
function remainingTime() public view returns (uint256) {
```



