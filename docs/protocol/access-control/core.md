---
description: 'The access control, source of truth, and DAO treasury for Fei Protocol'
---

# Core

## Contract

[Core.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/core/Core.sol) implements [ICore](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/core/ICore.sol), [Permissions](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/core/Permissions.sol)

## Description

The Core contract is responsible for a few things:

* Access control
* Pointing to [FEI](../fei-stablecoin/), [TRIBE](../../governance/tribe.md), and [GenesisGroup](../genesis/genesisgroup.md) contracts
* Stores whether GenesisGroup has completed
* Escrowing DAO TRIBE treasury

The access control module is managed by Permissions.

{% page-ref page="permissions.md" %}

Most other Fei Protocol contracts should refer to Core by implementing the [CoreRef](../references/coreref.md) contract.

When Core is constructed and initialized it does the following:

* Set sender as governor
* Create and reference FEI and TRIBE contracts

The governor will then set the genesis group contract.

When the genesis group conditions are met, the GenesisGroup contract should complete the genesis group by calling `completeGenesisGroup()`

## [Access Control](./) 

* Governor ⚖️

## Events

{% tabs %}
{% tab title="FeiUpdate" %}
Governance change of FEI token address

| type | param | description |
| :--- | :--- | :--- |
| address indexed |  \_fei | new FEI address |
{% endtab %}

{% tab title="TribeUpdate" %}
Governance change of TRIBE token address

| type | param | description |
| :--- | :--- | :--- |
| address indexed |  \_tribe | new TRIBE address |
{% endtab %}

{% tab title="GenesisGroupUpdate" %}
Governance change of GenesisGroup address

| type | param | description |
| :--- | :--- | :--- |
| address indexed |  \_genesisGroup | new Genesis Group address |
{% endtab %}

{% tab title="TribeAllocation" %}
Governance deployment of TRIBE tokens from treasury

| type | param | description |
| :--- | :--- | :--- |
| address indexed |  \_to | The address to receive TRIBE |
| uint256 | \_amount | The amount of TRIBE distributed |
{% endtab %}

{% tab title="GenesisPeriodComplete" %}
Signals completion of Genesis Period and full launch of FEI protocol

| type | param | description |
| :--- | :--- | :--- |
| uint256 |  \_timestamp | The block timestamp at Genesis completion |
{% endtab %}
{% endtabs %}

## Read-Only Functions

```javascript
function fei() external view returns (IFei);

function tribe() external view returns (IERC20);

function genesisGroup() external view returns (address);

function hasGenesisGroupCompleted() external view returns (bool);
```

## State-Changing Functions <a id="state-changing-functions"></a>

### Governor-Only⚖️ 

```javascript
function setFei(address token) external;

function setTribe(address token) external;

function setGenesisGroup(address _genesisGroup) external;

function allocateTribe(address to, uint256 amount) external;
```

### GenesisGroup-Only🚀

```javascript
function completeGenesisGroup() external;
```



