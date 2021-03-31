---
description: A reference to a Uniswap pair holding FEI
---

# UniRef

## Contract

[UniRef.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/UniRef.sol) implements [IUniRef](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/IUniRef.sol), [OracleRef](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/OracleRef.sol)

## Description

UniRef is an abstract contract which references a Uniswap pool. It defines basic utilities for contracts referencing Uniswap. It leverages the [OracleRef](oracleref.md) contract to calculate various quantities relating to spot vs peg price. Let _R_  be the reserves of the referenced Uniswap pair, FEI/ETH for example. The UniRef calculates the price at the start and end of a hypothetical trade of size _x_ via the below formulas. It can then calculate the magnitude of the distance from the peg _m_ given an oracle price _O:_ 

![Formula for start and end price of a trade of size x, and distance from peg m](../../.gitbook/assets/screen-shot-2021-02-14-at-12.40.56-pm%20%281%29%20%281%29%20%281%29%20%281%29%20%281%29%20%281%29%20%281%29.png)

It has other utilities relating to the peg _O_:

* Check whether below peg or not
* Get amount of a certain asset \(fei or other\) to trade to bring back to peg. This can be done by setting the end price in the above formula to _O_ and solving for _x_, replacing the FEI reserves with the target asset reserves and ETH reserves with the other asset reserves. We take the absolute value here and infer the direction based on whether above or below peg.

![Formula for amount of assets to trade to the peg on Uniswap](../../.gitbook/assets/screen-shot-2021-02-14-at-9.07.55-pm.png)

{% hint style="info" %}
When calculating the magnitude distance from the peg, the protocol only needs to know the deviation when underpegged. Therefore at or above the peg UniRef returns 0 for the deviation. 
{% endhint %}

## Events

{% tabs %}
{% tab title="PairUpdate" %}
Referenced Uniswap pair contract update

| type | param | description |
| :--- | :--- | :--- |
| address indexed | \_pair | new Uniswap pair contract |
{% endtab %}
{% endtabs %}

## Read-Only Functions

### router

```javascript
function router() external view returns (IUniswapV2Router02);
```

Returns the address of the UniswapV2Router as an interface.

{% embed url="https://uniswap.org/docs/v2/smart-contracts/router02/" caption="UniswapV2Router02" %}

### pair

```javascript
function pair() external view returns (IUniswapV2Pair);
```

Returns the referenced UniswapV2Pair contract as an interface.

{% embed url="https://uniswap.org/docs/v2/smart-contracts/pair/" caption="UniswapV2Pair" %}

### token

```javascript
function token() external view returns (address);
```

Returns the address of the ERC-20 token held in the UniswapV2Pair that is not FEI.

### getReserves

```javascript
function getReserves()
    external
    view
    returns (uint256 feiReserves, uint256 tokenReserves);
```

Returns the reserves of the referenced UniswapV2Pair contract, ordered as FEI, and the other token.

### liquidityOwned

```javascript
function liquidityOwned() external view returns (uint256);
```

Returns the amount of UniswapV2Pair liquidity provider tokens owned by this contract.

### deviationBelowPeg

```javascript
function deviationBelowPeg(
    Decimal.D256 calldata price,
    Decimal.D256 calldata peg
) external pure returns (Decimal.D256 memory);
```

Returns the percent deviation from the peg "m" in the above formulas. Assumes prices are reported as FEI per X e.g. 1720.95 FEI per ETH and pegs are reported as USD per X. 

If the price of FEI is above the peg \(meaning the input value is below the input peg\), then the function returns 0;

## Governor-Only⚖️ State-Changing Functions

### setPair

```javascript
function setPair(address _pair) external;
```

Sets the referenced Uniswap pair contract to `_pair`

emits `PairUpdate`

## ABIs

{% file src="../../.gitbook/assets/uniref.json" caption="UniRef ABI" %}

{% file src="../../.gitbook/assets/iuniref.json" caption="UniRef Interface ABI" %}

