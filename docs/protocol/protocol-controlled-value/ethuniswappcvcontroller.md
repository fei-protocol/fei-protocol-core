---
description: A PCV Controller for reweighting ETH/FEI Uniswap prices
---

# EthUniswapPCVController

## Contract

[EthUniswapPCVController.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pcv/EthUniswapPCVController.sol) implements [IUniswapPCVController](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pcv/IUniswapPCVController.sol), [UniRef](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/UniRef.sol)

## Description

A contract for moving reweighting Uniswap prices to the peg from a Uniswap PCV Deposit. ETH specific implementation.

### Reweight

Reweights are used to return the Uniswap spot price of an associated PCV Deposit to the peg. The algorithm is as follows:

1. withdraw 99% of the ETH from the UniswapPCVDeposit
2. execute a trade with held ETH to bring the spot price back up to peg
3. deposit remaining ETH balance back into the Uniswap PCV Deposit
4. burn excess held FEI

{% hint style="info" %}
Only 99% is withdrawn because if there are no other LPs there could be rounding errors against dust
{% endhint %}

### Reweight eligibility

The reweight is open to a keeper when both of the following conditions are met:

* the distance from the peg is at least the minimum \(currently 0.5%\)
* The frequency window has passed \(currently 4h\)

Governor⚖️and Guardian🛡contracts can force a reweight at any time, or update the minimum distance requirement.

### Reweight incentives

Reweight executions are incentivized with 200 FEI if the controller is appointed as a Minter💰. Governance can adjust this incentive amount.

## [Access Control](../access-control/) 

* Minter💰
* PCV Controller⚙️

## Events

{% tabs %}
{% tab title="Reweight" %}
A Uniswap Reweight event

| type | param | description |
| :--- | :--- | :--- |
| address indexed | \_caller | the address triggering the reweight |
{% endtab %}

{% tab title="PCVDepositUpdate" %}
Change the PCV Deposit contract

| type | param | description |
| :--- | :--- | :--- |
| address indexed | \_pcvDeposit | new pcv deposit contract |
{% endtab %}

{% tab title="ReweightIncentiveUpdate" %}
Change the FEI reward for reweighting

| type | param | description |
| :--- | :--- | :--- |
| uint256 | \_amount | FEI reward amount |
{% endtab %}

{% tab title="ReweightMinDistanceUpdate" %}
Change the min distance for a reweight

| type | param | description |
| :--- | :--- | :--- |
| uint256 | \_basisPoints | Minimum reweight amount in basis points \(i.e. 1/10000\) |
{% endtab %}

{% tab title="ReweightWithdrawBPsUpdate" %}
Change the amount of PCV withdrawn during a reweight

| type | param | description |
| :--- | :--- | :--- |
| uint256 | \_reweightWithdrawBPs | amount of PCV withdrawn for a reweight in basis point terms \(1/10000\). |
{% endtab %}
{% endtabs %}

## Read-Only Functions

### pcvDeposit

```javascript
function pcvDeposit() external returns (IPCVDeposit);
```

Returns the PCV Deposit address this controller focuses on reweighting.

### incentiveContract

```javascript
function incentiveContract() external returns (IUniswapIncentive);
```

Returns the [UniswapIncentive](../fei-stablecoin/uniswapincentive.md) contract used to determine reweight eligibility.

### reweightIncentiveAmount

```javascript
function reweightIncentiveAmount() external returns (uint256);
```

Returns the amount of FEI received by any keeper who successfully executes a reweight.

### reweightWithdrawBPs

```javascript
function reweightWithdrawBPs() external returns (uint256);
```

Returns the amount of PCV withdrawn during a reweight in basis points terms.

### reweightEligible

```javascript
function reweightEligible() external view returns (bool);
```

Returns true when the distance from the peg is at least the minimum \(initially 1%\) and the [UniswapIncentive](../fei-stablecoin/uniswapincentive.md) contract is at incentive parity, otherwise false.

### minDistanceForReweight

```javascript
function minDistanceForReweight()
    external
    view
    returns (Decimal.D256 memory);
```

Returns the minimum percent distance from the peg needed for keepers to reweight the peg.

## EOA-Only 👤 State-Changing Functions

### reweight

```javascript
function reweight() external;
```

Executes a reweight if `reweightEligible.`

Rewards the caller with 500 FEI.

{% hint style="info" %}
This method is [pausable](../../governance/fei-guardian.md)
{% endhint %}

## Governor- Or Guardian-Only⚖️🛡 State-Changing Functions

### forceReweight

```javascript
function forceReweight() external;
```

Forces a reweight execution. No FEI incentive for doing this. Fails if the Uniswap spot price is already at or above the peg.

## Governor-Only⚖️ State-Changing Functions

### setReweightMinDistance

```javascript
function setReweightMinDistance(uint256 basisPoints) external;
```

Sets the minimum distance from the peg for a reweight to be eligible to `basisPoints`, measured in basis points \(i.e. 1/10000\).

emits `ReweightMinDistanceUpdate`

### setReweightWithdrawBPs

```javascript
function setReweightWithdrawBPs(uint256 _reweightWithdrawBPs) external;
```

Sets the percentage of the PCV withdrawn when executing a reweight in terms of basis points

emits `ReweightWithdrawBPsUpdate`

### setPCVDeposit

```javascript
function setPCVDeposit(address _pcvDeposit) external;
```

Sets the target PCV Deposit contract for reweight to `_pcvDeposit`

emits `PCVDepositUpdate`

### setReweightIncentive

```javascript
function setReweightIncentive(uint256 amount) external;
```

Sets the keeper incentive for executing a reweight to `amount` of FEI

emits `ReweightIncentiveUpdate`

## ABIs

{% file src="../../.gitbook/assets/ethuniswappcvcontroller.json" caption="EthUniswapPCVController ABI" %}

{% file src="../../.gitbook/assets/iuniswappcvcontroller.json" caption="UniswapPCVController Interface ABI" %}

