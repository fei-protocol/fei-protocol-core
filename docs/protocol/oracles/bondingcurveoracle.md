---
description: An oracle which references a bonding curve price
---

# BondingCurveOracle

## Contract

[BondingCurveOracle.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/oracle/BondingCurveOracle.sol) implements [IBondingCurveOracle](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/oracle/IBondingCurveOracle.sol), [CoreRef](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/CoreRef.sol), [Timed](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/utils/Timed.sol)

## Description

The BondingCurveOracle contract pegs to a linked bonding curve price pre Scale and to a normal UniswapOracle post Scale.

The contract stores the bonding curve \(pre-Scale\) and Uniswap \(post-scale\) oracle contracts to reference.

Updates to the bonding curve oracle update the linked uniswap oracle.

### Thawing

Additionally, the contract includes the "thawing" process. Thawing implements the initial pegged price lower than the target uniswap/bonding curve price. The reported peg linearly converges on the target peg over a preset duration window. The duration window _d_ is 2 weeks. At the beginning of the window it reports the peg at the initial price _I_ and at the end it will report the peg at the target price _T_. Let _t_ be the timestamp between \[0,d\]. The reported oracle price _O_ during the thawing period is:

![](../../.gitbook/assets/screen-shot-2021-02-14-at-5.23.16-pm.png)

## Events

{% tabs %}
{% tab title="Update" %}
 new reported peg

| type | param | description |
| :--- | :--- | :--- |
| uint256 | \_peg | new peg value |
{% endtab %}
{% endtabs %}

## Read-Only Functions

### read

```javascript
function read() external view returns (Decimal.D256 memory, bool);
```

Reads the oracle value and reports the peg as FEI per underlying. The boolean value returned informs whether the reported oracle value is valid. Invalid value means the oracle is uninitialized or the kill switch is engaged.

#### isOutdated

```javascript
function isOutdated() external view returns (bool);
```

Pass through calls `uniswapOracle.isOutdated()`, if false, then multiple read functions relying on the oracle would be inaccurate.

#### uniswapOracle

```javascript
function uniswapOracle() external returns (IOracle);
```

The referenced [Uniswap Oracle](uniswaporacle.md)

#### bondingCurve

```javascript
function bondingCurve() external returns (IBondingCurve);
```

The referenced [Bonding Curve](../bondingcurve/)

#### initialPrice

```javascript
function initialPrice() external returns (Decimal.D256 memory);
```

The initial price to thaw from during the thawing period reported as USD per FEI.

## State-Changing Functions <a id="state-changing-functions"></a>

### Public

#### update

```javascript
function update() external returns (bool);
```

Pass-through updates `uniswapOracle`

### GenesisGroup-Only🚀

#### init

```javascript
function init(Decimal.D256 calldata initialPrice) external;
```

called by the [GenesisGroup](../genesis/genesisgroup.md) with the initial price to thaw from

