---
description: An ETH/USDC Uniswap TWAP snapshot oracle
---

# UniswapOracle

## Contract

[UniswapOracle.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/oracle/UniswapOracle.sol) implements [IUniswapOracle](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/oracle/IUniswapOracle.sol), [CoreRef](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/CoreRef.sol)

## Description

The UniswapOracle contract maintains a uniswap TWAP.

Maintains a pair contract to reference and a flag for whether the target price is token0 or token1 of the pair. Has a timestamp duration which must be exceeded between oracle updates. This duration is 10 minutes at launch.

Updates should:

* take the difference between the current and prior timestamp and make sure it exceeds the duration
* get the cumulative price difference between Eth and USDC and normalize by 10\*\*12 \(the decimal difference between them\)
* divide 2^112 by the ratio between the cumulative price and timestamp to get a peg price.
* update the peg and prior cumulative and timestamp

The governor can change the duration if needed.

## Events

{% tabs %}
{% tab title="Update" %}
 new reported peg

| type | param | description |
| :--- | :--- | :--- |
| uint256 | \_peg | new peg value |
{% endtab %}

{% tab title="KillSwitchUpdate" %}
Oracle kill switch change

| type | param | description |
| :--- | :--- | :--- |
| bool | \_killSwitch | new value of the kill switch flag |
{% endtab %}

{% tab title="DurationUpdate" %}
 New TWAP duration

| type | param | description |
| :--- | :--- | :--- |
| uint256 | \_duration | new value of the TWAP duration |
{% endtab %}
{% endtabs %}

## Read-Only Functions

```javascript
function read() external view returns (Decimal.D256 memory, bool);

function isOutdated() external view returns (bool);

function killSwitch() external view returns (bool);

function priorTimestamp() external returns (uint32);

function priorCumulative() external returns (uint256);

function duration() external returns (uint256);

function pair() external returns (IUniswapV2Pair);
```

## State-Changing Functions <a id="state-changing-functions"></a>

### Public

```javascript
function update() external returns (bool);
```

### Governor-Only⚖️

```javascript
function setKillSwitch(bool _killSwitch) external;

function setDuration(uint256 _duration) external;
```

