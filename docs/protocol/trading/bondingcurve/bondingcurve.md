# BondingCurve

## Contract

[BondingCurve.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/bondingcurve/BondingCurve.sol) implements [IBondingCurve](https://github.com/fei-protocol/fei-protocol-core/wiki/IBondingCurve), [OracleRef](https://github.com/fei-protocol/fei-protocol-core/wiki/OracleRef), [PCVSplitter](https://github.com/fei-protocol/fei-protocol-core/wiki/PCVSplitter)

## Description

An abstract bonding curve for purchasing FEI and routing the purchase asset to PCV

## [Access Control](../../access-control/) 

* Minter💰

## Events

{% tabs %}
{% tab title="Purchase" %}
Purchase of FEI on bonding curve

| type | param | description |
| :--- | :--- | :--- |
| address indexed | \_to | recipient of FEI |
| uint256 | \_amountIn | amount of purchase asset |
| uint256 | \_amountOut | amount of FEI |
{% endtab %}

{% tab title="Allocate" %}
Allocate held PCV

| type | param | description |
| :--- | :--- | :--- |
| address indexed | \_caller | the sender of the allocation transaction |
| uint256 | \_amount | the amount of PCV allocated |
{% endtab %}

{% tab title="ScaleUpdate" %}
Governance change of Scale target

| type | param | description |
| :--- | :--- | :--- |
| uint256 | \_scale | new Scale target |
{% endtab %}

{% tab title="BufferUpdate" %}
Governance change of Buffer

| type | param | description |
| :--- | :--- | :--- |
| uint256 | \_buffer | new buffer |
{% endtab %}
{% endtabs %}

## Implementation

Fei Protocol bonding curves should have a couple common features:

* a curve formula which approaches the peg
* a "Scale" issuance target beyond which the peg price fixes
* a "buffer" which is applied on top of the peg price post scale
* maintain a FEI\_b counter to compare to the scale target

The amount of FEI received from a purchase transaction is be determined by integrating the price function between the current FEI\_b amount and the amount after the transaction. We then solve for the upper bound and subtract out the starting point. Once post scale, the price should simply be the peg \* \(1 + buffer\) where the peg is reported as FEI per X. In the implementation we actually use \(1 - buffer\) because the peg is inverted so the price relationship is also inverted.

Incoming PCV should be held temporarily to allow for batch transactions via the `allocate()` function. The PCV allocation should split according to the [PCVSplitter](https://github.com/fei-protocol/fei-protocol-core/wiki/PCVSplitter). While allocations can be called at any time, there is a 500 FEI incentive for calling it after each 1 day window.

## Read-Only Functions

```javascript
function getCurrentPrice() external view returns (Decimal.D256 memory);

function getAveragePrice(uint256 amountIn)
    external
    view
    returns (Decimal.D256 memory);

function getAmountOut(uint256 amountIn)
    external
    view
    returns (uint256 amountOut);

function scale() external view returns (uint256);

function atScale() external view returns (bool);

function buffer() external view returns (uint256);

function totalPurchased() external view returns (uint256);

function getTotalPCVHeld() external view returns (uint256);

function incentiveAmount() external view returns (uint256);
```

## State-Changing Functions <a id="state-changing-functions"></a>

### Public

```javascript
function purchase(address to, uint256 amountIn)
    external
    payable
    returns (uint256 amountOut);

function allocate() external;
```

### Governor-Only**⚖️**

```javascript
function setBuffer(uint256 _buffer) external;

function setScale(uint256 _scale) external;

function setAllocation(
    address[] calldata pcvDeposits,
    uint256[] calldata ratios
) external;
```

