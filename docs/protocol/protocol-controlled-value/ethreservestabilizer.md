---
description: Exchanges FEI for ETH from the reserves
---

# EthReserveStabilizer

## Contract

[EthReserveStabilizer.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pcv/EthReserveStabilizer.sol) implements [IReserveStabilizer](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pcv/IReserveStabilizer.sol), [OracleRef](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/OracleRef.sol)

## Description

A contract for exchanging FEI for ETH from reserves at some USD price relative to an oracle.

For example if ETH is $2500 and the usd exchange rate for FEI is $0.90 then ~2777 FEI can be exchanged for 1 ETH.

Receives ETH from the EthPCVDripper in batches

{% page-ref page="ethpcvdripper.md" %}

## Parameterization

| Param | Value |
| :--- | :--- |
| usdPerFeiBasisPoints | 95000 \(95%\) |
| oracle | [0x087F35bd241e41Fc28E43f0E8C58d283DD55bD65](https://etherscan.io/address/0x087F35bd241e41Fc28E43f0E8C58d283DD55bD65) \(UniswapOracle\) |

## [Access Control](../access-control/) 

* Burner🔥

## Events

{% tabs %}
{% tab title="FeiExchange" %}
Exchange FEI for ETH from the PCV

| type | param | description |
| :--- | :--- | :--- |
| address indexed | to | address of the exchanger |
| uint256 | feiAmount | amount of FEI exchanged |
| uint256 | amountOut | amount of ETH received |
{% endtab %}

{% tab title="Withdrawal" %}
Withdrawal of PCV

| type | param | description |
| :--- | :--- | :--- |
| address indexed | \_caller | the PCV controller calling this function |
| address indexed | \_to | the recipient address of the PCV |
| uint256 | \_amount | amount withdrawn |
{% endtab %}

{% tab title="UsdPerFeiRateUpdate" %}
Update of the conversion rate between USD and FEI

| type | param | description |
| :--- | :--- | :--- |
| uint256 | basisPoints | amount of basis points in USD per FEI terms |
{% endtab %}
{% endtabs %}

## Read-Only Functions

### getAmountOut

```javascript
function getAmountOut(uint256 amountFeiIn) external view returns (uint256);
```

Returns the amount of ETH received for a FEI exchange of size `amountFeiIn`

Multiplies the `amountFeiIn` by the inverted peg and the `usdPerFeiBasisPoints` / 10000

{% hint style="warning" %}
Can be inaccurate if outdated, need to call `oracle().isOutdated()` to check
{% endhint %}

### usdPerFeiBasisPoints

```javascript
function usdPerFeiBasisPoints() external view returns (uint256);
```

returns the `usdPerFeiBasisPoints` exchange rate between FEI and $1 worth of ETH denominated in basis points \(1/10000\)

## Public State-Changing Functions

### exchangeFei

```javascript
function exchangeFei(uint256 feiAmount) external returns (uint256);
```

Burns `feiAmount` FEI from the caller then sends `getAmountOut(feiAmount)` of ETH to the caller and returns that value

emits FeiExchange

## PCV Controller-Only ⚙️ State-Changing Functions

### withdraw

```javascript
function withdraw(address to, uint256 amount) external;
```

Withdraws `amount` ETH to address `to` from the EthReserveStabilizer

emits Withdrawal

## Governor-Only⚖️ State-Changing Functions

```javascript
function setUsdPerFeiRate(uint256 exchangeRateBasisPoints) external;
```

Sets the `usdPerFeiBasisPoints` to `exchangeRateBasisPoints`

emits UsdPerFeiRateUpdate

## ABIs

{% file src="../../.gitbook/assets/ethreservestabilizer.json" caption="EthReserveStabilizer ABI" %}

{% file src="../../.gitbook/assets/ireservestabilizer.json" caption="IReserveStabilizer ABI" %}

