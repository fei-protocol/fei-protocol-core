---
description: A timer utility for keeping track of elapsed time within a window
---

# Timed

## Contract

[Timed.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/utils/Timed.sol)

## Description

Abstract contract for managing timed events that complete after a period

The contract has a duration _d_ denominated in seconds. It has an effective timestamp _t_ on the range \[0,d\]. After the period has ended, _t_ stays fixed at _d_.

When it is initialized, it sets the current block timestamp to _t=0_. The remaining time is _d-t_ and the completion condition is remaining = 0 \(_t=d_\).

## Events

{% tabs %}
{% tab title="DurationUpdate" %}
Change in the duration of the timer

| type | param | description |
| :--- | :--- | :--- |
| uint256 | \_duration | new duration |
{% endtab %}

{% tab title="TimerReset" %}
A reset of the timer

| type | param | description |
| :--- | :--- | :--- |
| uint256 | \_startTime | new timer start |
{% endtab %}
{% endtabs %}

## Read-Only Functions

### isTimeEnded

```javascript
function isTimeEnded() external view returns (bool);
```

Returns true if elapsed time _t_ is equal to the duration _d._ 

### startTime

```javascript
function startTime() external view returns (uint256);
```

Returns the starting block timestamp of the window.

### duration

```javascript
function duration() external view returns (uint256);
```

Returns the duration _d_ of the window.

### timeSinceStart

```javascript
function timeSinceStart() external view returns (uint256);
```

Returns the elapsed time _t_ since the startTime, with _d_ as the maximum.

### remainingTime

```javascript
function remainingTime() external view returns (uint256);
```

Returns the time remaining in the window _t - d_. 

## ABIs

{% file src="../../.gitbook/assets/timed.json" caption="Timed" %}

