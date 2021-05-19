---
description: Allows for percentage withdrawals of PCV from PCV Deposits
---

# RatioPCVController

## Contract

[RatioPCVController](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pcv/RatioPCVController.sol) implements [CoreRef](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/CoreRef.sol)

## Description

Enables withdrawing a percentage of PCV from a IPCVDeposit contract. This is useful when the amount of PCV in the contract can change during the voting and execution windows of a proposal.

e.g. sending ETH to the [EthPCVDripper](ethpcvdripper.md) from the [EthBondingCurve](../bondingcurve/ethbondingcurve.md)

## [Access Control](../access-control/) 

PCVController⚙️

## Events

{% tabs %}
{% tab title="Withdraw" %}
A withdrawal of PCV to a target

| type | param | description |
| :--- | :--- | :--- |
| address indexed | pcvDeposit | The PCV deposit to withdraw from |
| address indexed | to | the target to send PCV to |
| uint256 | amount | amount withdrawn |
{% endtab %}
{% endtabs %}

## Public State-Changing Functions

### withdrawRatio

```javascript
function withdrawRatio(IPCVDeposit pcvDeposit, address to, uint256 basisPoints) public;
```

Withdraws `basisPoints` / 10000 PCV from `pcvDeposit` and sends to address `to`

Calculates the amount of PCV by calling `totalValue()` on the `pcvDeposit` and multiplying by the ratio

emits Withdraw

