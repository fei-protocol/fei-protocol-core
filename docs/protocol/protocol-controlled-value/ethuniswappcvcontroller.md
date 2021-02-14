---
description: A PCV Controller for reweighting ETH/FEI Uniswap prices
---

# EthUniswapPCVController

## Contract

[EthUniswapPCVController.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pcv/EthUniswapPCVController.sol) implements [IUniswapPCVController](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pcv/IUniswapPCVController.sol), [UniRef](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/UniRef.sol)

## Description

A contract for moving reweighting Uniswap prices to the peg from a Uniswap PCV Deposit. ETH specific implementation.

### Reweight

Reweights have the goal of returning the Uniswap spot price of an associated PCV Deposit to the peg. The algorithm is as follows:

* withdraw all existing PCV from the PCV Deposit
* check if remaining LP exists, if so execute a trade with held assets to bring the spot price back up to peg
* deposit remaining held balance back into the Uniswap PCV Deposit
* burn excess held FEI

### Reweight eligibility

The reweight is open to the public when both of the following conditions are met:

* the distance from the peg is at least the minimum \(initially 1%\)
* the [UniswapIncentive](https://github.com/fei-protocol/fei-protocol-core/wiki/UniswapIncentive) contract is at incentive parity

Governor contracts can also force a reweight at any time. Governor can also update the minimum distance.

### Reweight incentives

Open reweight executions are incentivized with 500 FEI if the controller is appointed as a minter. Governance can adjust this incentive amount

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
{% endtabs %}

## Read-Only Functions

```javascript
function pcvDeposit() external returns (IPCVDeposit);

function incentiveContract() external returns (IUniswapIncentive);

function reweightIncentiveAmount() external returns (uint256);

function reweightEligible() external view returns (bool);

function minDistanceForReweight()
    external
    view
    returns (Decimal.D256 memory);
```

## State-Changing Functions <a id="state-changing-functions"></a>

### Public

```javascript
function reweight() external;
```

### Governor-Only⚖️

```javascript
function forceReweight() external;

function setPCVDeposit(address _pcvDeposit) external;

function setReweightIncentive(uint256 amount) external;

function setReweightMinDistance(uint256 basisPoints) external;
```

