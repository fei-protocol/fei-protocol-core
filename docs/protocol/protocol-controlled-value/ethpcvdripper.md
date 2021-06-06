---
description: Drips ETH into a target contract
---

# EthPCVDripper

## Contract

[EthPCVDripper](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pcv/EthPCVDripper.sol) implements [CoreRef](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/CoreRef.sol), [Timed](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/utils/Timed.sol)

## Description

Drips fixed size batches of held ETH to a target contract with a certain frequency.

{% hint style="info" %}
If the target has at least the batch size \(`amountToDrip`\)  then the drip will fail
{% endhint %}

The dripper prevents a target contract from holding more than 2x the batch size of ETH effectively allowing a smoother release of potentially large amounts of ETH to target contracts.

This has a few advantages:

* Allowing the [Guardian](../../governance/fei-guardian.md) to intervene in the event of an issue
* Mitigating oracle manipulation risk
* Preventing large ETH supply shocks to happen instantaneously

## Parameterization

| Param | Value |
| :--- | :--- |
| amountToDrip | 5000000000000000000000 \(5000 ETH\) |
| duration | 3600 \(1 hour\) |
| target | [0xa08A721dFB595753FFf335636674D76C455B275C](https://etherscan.io/address/0xa08A721dFB595753FFf335636674D76C455B275C) \([EthReserveStabilizer](ethreservestabilizer.md)\) |

## [Access Control](../access-control/) 

None

## Events

{% tabs %}
{% tab title="Dripped" %}
A drip to the target

| type | param | description |
| :--- | :--- | :--- |
| uint256 | amount | amount ETH dripped |
{% endtab %}

{% tab title="Withdrawal" %}
Withdrawal of PCV

| type | param | description |
| :--- | :--- | :--- |
| address indexed | \_to | the recipient address of the PCV |
| uint256 | \_amount | amount withdrawn |
{% endtab %}
{% endtabs %}

## Read-Only Functions

### isTargetBalanceLow

```javascript
function isTargetBalanceLow() external view returns (bool);
```

Returns true when the target balance is less than `amountToDrip`

### target

```javascript
function target() external view returns (address);
```

Returns the target address to drip to

### amountToDrip

Returns the amount dripped to the target on each drip call

## Public State-Changing Functions

### drip

```javascript
function drip() external;
```

Sends `amountToDrip()` ETH to `target()` if the following conditions are met:

* `duration` seconds have passed since the last drip
* the contract is not paused by the [Guardian](../../governance/fei-guardian.md)
* `isTargetBalanceLow()` is true

emits Dripped

## PCV Controller-Only ⚙️ State-Changing Functions

### withdraw

```javascript
function withdrawETH(address payable to, uint256 amount) external;
```

Withdraws `amount` ETH to address `to` from the EthPCVDripper

emits Withdrawal

## ABIs

{% file src="../../.gitbook/assets/ethpcvdripper.json" caption="EthPCVDripper ABI" %}

