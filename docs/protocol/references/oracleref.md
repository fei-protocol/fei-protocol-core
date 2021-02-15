---
description: A reference to an oracle contract
---

# OracleRef

## Contract

[OracleRef.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/OracleRef.sol) implements [IOracleRef](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/IOracleRef.sol), [CoreRef](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/CoreRef.sol)

## Description

OracleRef is an abstract contract which references an oracle. It defines some basic utilities useful for contracts referencing an oracle.

The contract allows for updating or reading from the oracle. The oracle price is reported as FEI per X where X is some other asset like ETH, USDC, or USD depending on the oracle needs.

It allows a Governor⚖️to change the referenced Oracle

{% page-ref page="../oracles/" %}

## Events

{% tabs %}
{% tab title="OracleUpdate" %}
Referenced oracle contract update

| type | param | description |
| :--- | :--- | :--- |
| address indexed | \_oracle | new oracle |
{% endtab %}
{% endtabs %}

## Read-Only Functions

### oracle

```javascript
function oracle() external view returns (IOracle);
```

Returns the address of the referenced oracle as an interface.

### peg

```javascript
function peg() external view returns (Decimal.D256 memory);
```

Returns the output of `oracle().read()`, reverts if the oracle is invalid.

### invert

```javascript
function invert(Decimal.D256 calldata price)
    external
    pure
    returns (Decimal.D256 memory);
```

Inverts a `price` to be reported in the reverse direction. When applied to `peg` it reports X per FEI wher X is some underlying asset.

## State-Changing Functions <a id="state-changing-functions"></a>

### Public

```javascript
function updateOracle() external returns (bool);
```

Pass-through updates the referenced oracle.

### Governor-Only⚖️

```javascript
function setOracle(address _oracle) external;
```

Sets the address of the referenced oracle to `_oracle`.

emits `OracleUpdate`

### 

