---
description: A reference to Fei Core
---

# CoreRef

## Contract

[CoreRef.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/CoreRef.sol) implements [ICoreRef](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/ICoreRef.sol)

## Events

{% tabs %}
{% tab title="CoreUpdate" %}
Referenced Fei Core contract update

| type | param | description |
| :--- | :--- | :--- |
| address indexed | \_core | new Fei Core |
{% endtab %}
{% endtabs %}

## Description

CoreRef is an abstract contract which references Core. It defines some basic modifiers and utilities useful for contracts referencing Core.

Almost all Fei Protocol contracts should implement the CoreRef contract.

## Implementation

The contract defines modifiers of the following types:

* restrict access to certain roles
* conditional execution if a role is held
* restrict access to certain contracts \(Fei, Core, GenesisGroup\)
* restrict access to post genesis period

It allows the governor of a currently referenced Core contract to update to a new referenced Core contract

It can read in referenced contract addresses including Core, Fei, Tribe or get token balances.

## Read-Only Functions

## State-Changing Functions <a id="state-changing-functions"></a>

### Governor-Only 

### GenesisGroup-Only

