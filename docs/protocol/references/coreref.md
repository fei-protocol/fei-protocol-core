---
description: A reference to Fei Core
---

# CoreRef

## Contract

[CoreRef.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/CoreRef.sol) implements [ICoreRef](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/ICoreRef.sol), [Pausable](https://docs.openzeppelin.com/contracts/3.x/api/utils#Pausable)

## Description

CoreRef is an abstract contract which references Core. It defines basic modifiers and utilities useful for contracts referencing Core.

Most of all Fei Protocol contracts implement the CoreRef contract.

The contract defines modifiers of the following types:

* restrict access to certain roles
* conditional execution if a role is held
* restrict access to certain contracts \(Fei, Core, GenesisGroup\)
* restrict access to post genesis period

It allows the governor of a currently referenced Core contract to update to a new referenced Core contract

It can read in referenced contract addresses including Core, Fei, Tribe or get token balances.

{% page-ref page="../access-control/core.md" %}

## Events

{% tabs %}
{% tab title="CoreUpdate" %}
Referenced Fei Core contract update

| type | param | description |
| :--- | :--- | :--- |
| address indexed | \_core | new Fei Core |
{% endtab %}
{% endtabs %}

## Read-Only Functions

### core

```javascript
function core() external view returns (ICore);
```

Returns the referenced [Fei Core](../access-control/core.md) address as an interface.

### fei

```javascript
function fei() external view returns (IFei);
```

Returns the [FEI](../fei-stablecoin/fei-fei-usd.md) token address as an interface.

### tribe

```javascript
function tribe() external view returns (IERC20);
```

Returns the [TRIBE](../../governance/tribe.md) token address as an interface.

### feiBalance

```javascript
function feiBalance() external view returns (uint256);
```

Returns the amount of FEI held by this contract

### tribeBalance

```javascript
function tribeBalance() external view returns (uint256);
```

Returns the amount of TRIBE held by this contract

## Governor-Only⚖️ State-Changing Functions

### setCore

```javascript
function setCore(address core) external;
```

Sets the currently referenced [Fei Core](../access-control/core.md) contract to `core`

emits `CoreUpdate`

## Guardian- Or Governor-Only🛡⚖️ State-Changing Functions

### pause

```javascript
function pause() external;
```

Puts the contract in the paused state which can shut down [pausable](https://docs.openzeppelin.com/contracts/3.x/api/utils#Pausable) external functions

### unpause

```javascript
function unpause() external;
```

Puts the contract in the unpaused state which can reopen [pausable](https://docs.openzeppelin.com/contracts/3.x/api/utils#Pausable) external functions

## ABIs

{% file src="../../.gitbook/assets/coreref.json" caption="CoreRef ABI" %}

{% file src="../../.gitbook/assets/icoreref.json" caption="CoreRef Interface ABI" %}

