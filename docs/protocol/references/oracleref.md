---
description: A reference to an oracle contract
---

# OracleRef

## Contract

[OracleRef.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/OracleRef.sol) implements [IOracleRef](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/IOracleRef.sol), [CoreRef](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/CoreRef.sol)

## Events

{% tabs %}
{% tab title="OracleUpdate" %}
Referenced oracle contract update

| type | param | description |
| :--- | :--- | :--- |
| address indexed | \_oracle | new oracle |
{% endtab %}
{% endtabs %}

## Description

OracleRef is an abstract contract which references an oracle. It defines some basic utilities useful for contracts referencing an oracle.

## Implementation

The contract allows for updating or reading from the oracle. The oracle price is reported as FEI per X where X is some other asset like ETH, USDC, or USD depending on the oracle needs.

The `invert` function allows for the reporting to be done in the reverse direction.

It allows a governor to update the referenced Oracle

## Read-Only Functions

## State-Changing Functions <a id="state-changing-functions"></a>

### Governor-Only 

### GenesisGroup-Only

