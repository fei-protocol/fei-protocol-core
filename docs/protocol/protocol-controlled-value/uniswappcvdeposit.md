---
description: A PCV deposit for holding Uniswap liquidity
---

# UniswapPCVDeposit

## Contract

[UniswapPCVDeposit.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pcv/UniswapPCVDeposit.sol) implements [IPCVDeposit](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pcv/IPCVDeposit.sol), [UniRef](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/UniRef.sol)

## Description

An abstract contract for storing PCV in a Uniswap FEI liquidity pair

Uniswap PCV deposits should be able to receive PCV, mint the corresponding amount of FEI to match spot, and deposit to Uniswap. They should also be able to withdraw and read in the amount of non-fei PCV on unsiwap held in the contract.

When withdrawing, any excess fei held should be burned

When depositing, if no existing LP exists then the oracle price should be used. The oracle should be a [BondingCurveOracle](https://github.com/fei-protocol/fei-protocol-core/wiki/BondingCurveOracle) subject to thawing and the bonding curve price.

## [Access Control](../access-control/) 

* Minter💰

## Events

{% tabs %}
{% tab title="Deposit" %}
Deposit to the PCV

| type | param | description |
| :--- | :--- | :--- |
| address indexed | \_from | address of the depositor |
| uint256 | \_amount | amount deposited |
{% endtab %}

{% tab title="Withdrawal" %}
Withdrawal of PCV

| type | param | description |
| :--- | :--- | :--- |
| address indexed | \_caller | the PCV controller calling this function |
| address indexed | \_to | the recipient address of the PCV |
| uint256 | \_amount | amount withdrawn |
{% endtab %}
{% endtabs %}

## Read-Only Functions

```javascript
function totalValue() external view returns (uint256);
```

## State-Changing Functions <a id="state-changing-functions"></a>

### Public

```javascript
function deposit(uint256 amount) external payable;
```

### PCV Controller-Only ⚙️

```javascript
function withdraw(address to, uint256 amount) external;
```

