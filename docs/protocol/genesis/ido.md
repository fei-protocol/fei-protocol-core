---
description: The FEI/TRIBE Initial DEX Offering contract
---

# IDO

## Contract

[IDO.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/genesis/IDO.sol) implements [IDOInterface](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/genesis/IDOInterface.sol), [UniRef](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/UniRef.sol), [LinearTokenTimelock](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/utils/LinearTokenTimelock.sol)

## Description

IDO is an Initial DeFi Offering contract for listing FEI and TRIBE at genesis launch.

The IDO is deployed by the GenesisGroup contract. The GenesisGroup sets the initial exchange rate. The IDO should hold TRIBE tokens and mint the appropriate amount of FEI to match the given exchange rate. It will then send the TRIBE and FEI to Uniswap where it should be the only LP for the pair.

The LP shares held by the contract timelock linearly to the Fei Core Team and early-backers over a 4 year window from contract creation.

## [Access Control](../access-control/) 

* Minter💰

## Events

{% tabs %}
{% tab title="Deploy" %}
The IDO initialization with FEI and TRIBE. Only emitted once

| type | param | description |
| :--- | :--- | :--- |
| uint256 | \_amountFei | the amount of FEI deployed in the IDO |
| uint256 | \_amountTribe | the amount of TRIBE deployed in the IDO |
{% endtab %}
{% endtabs %}

## State-Changing Functions <a id="state-changing-functions"></a>

### GenesisGroup-Only🚀

#### deploy

```javascript
function deploy(Decimal.D256 calldata feiRatio) external;
```

Initializes the FEI/TRIBE Uniswap pool with liquidity based on the amount of TRIBE held by the contract and `feiRatio` times that amount worth of FEI. The FEI for this are minted by the IDO to itself. 

#### swapFei

```javascript
function swapFei(uint256 amountFei) external returns (uint256);
```

Swaps `amountFei` worth of FEI from the [GenesisGroup](genesisgroup.md) contract to the FEI/TRIBE Uniswap pool and back. The IDO must be approved for the FEI transfer.

