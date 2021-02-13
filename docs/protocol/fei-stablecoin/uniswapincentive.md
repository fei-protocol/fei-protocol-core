---
description: The Direct Incentives contract for FEI/ETH liquidity
---

# UniswapIncentive

## Contract

[UniswapIncentive.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/token/UniswapIncentive.sol) implements [IUniswapIncentive.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/token/IUniswapIncentive.sol), [UniRef](https://github.com/fei-protocol/fei-protocol-core/wiki/UniRef)

## Description

A FEI incentive contract applied on transfers involving a Uniswap pair.



## [Access Control](../access-control/) 

* Minter💰
* Burner🔥

## Events

{% tabs %}
{% tab title="TimeWeightUpdate" %}
Time Weight change

| type | param | description |
| :--- | :--- | :--- |
| uint256 | \_weight | new time weight |
| uint256 | \_active | whether time weight is growing or not |
{% endtab %}

{% tab title="GrowthRateUpdate" %}
Governance change of time weight growth weight

| type | param | description |
| :--- | :--- | :--- |
| uint256 | \_growthRate | new growth rate |
{% endtab %}

{% tab title="ExemptAddressUpdate" %}
Governance change of an exempt address 

| type | param | description |
| :--- | :--- | :--- |
| address indexed | \_account | the address to update |
| bool | \_isExempt | whether the account is exempt or not |
{% endtab %}

{% tab title="SellAllowedAddressUpdate" %}
Governance change of a sell allowlisted address 

| type | param | description |
| :--- | :--- | :--- |
| address indexed | \_account | the address to update |
| bool | \_isSellAllowed | whether the account is allowlisted or not |
{% endtab %}
{% endtabs %}

## Implementation

The UniswapIncentive contract assumes that all transfers involving uniswap are either a sell or a buy. In either case, the hypothetical start and end price are calculated and compared to the peg. These are fed into the incentive function to produce a mint \(in the case of buy\) or sell \(in the case of burn\). Any address can be exempted from incentives by governance. We will go into detail on each.

### Sell \(Burn\)

Any transfer going TO the uniswap pool is treated as a sell. This has the counterintuitive effect of treating liquidity provision events as sells.

The final magnitude _m_ deviation from the peg at the end of the hypothetical trade is used to maximize the potential penalty. The burn formula for sell amount _x_ is as follows: `x*m^2 * 100`

The burn should only apply if the trade ends up below the peg, and if the incentive contract is appointed as a Burner.

### Buy \(Mint\)

Any transfer going FROM the uniswap pool is treated as a buy. This has the counterintuitive effect of treating liquidity withdrawal events as buys.

The initial magnitude _m_ deviation from the peg before the hypothetical trade is used to maximize the potential mint. _w_ is a time weight we discuss in the next section. The mint formula for buy amount _x_ is as follows: `min(x*m*w, x*m^2)`

This caps the mint function at the output of the burn function so that burns are always greater or equal for a given magnitude _m_.

The mint should only apply if the trade starts below the peg, and if the incentive contract is appointed as a Minter.

### Time Weight

The time weight is a scaling factor to make the incentive structured more like an auction. The trader willing to accept the lowest mint will come in and buy first before the reward gets higher.

The time weight grows linearly at a rate set by governance. Its granularity is 100,000 per block. A growth rate of 1000 would increment the weight by one unit every 100 blocks. It should only grow while "active" and will only be active when the last trade ended below the peg.

Trades should update the time weight as follows:

* If ending above peg, set to 0 and deactivate
* If ending below the peg but starting above, set to 0 and activate
* If starting and ending below peg, update pro-rata with a buy based on percent towards peg. For example, if trade starts at 10% deviation and ends at 1%, time weight should be reduced by a factor of 10.
* If starting and ending below the peg, cap the time weight at the max incentive for the ending distance

### Incentive Parity

Incentive parity is defined as a boolean which is true when the mint incentive equals the burn incentive. This happens when the time weight reaches a level on par with the distance with the peg. If the distance is 5%, a time weight of 5 would lead to incentive parity. The burn incentive `m^2 * 100` would equal the mint incentive `w*m`.

Parity is used as a trigger condition for reweights in the [UniswapPCVController](https://github.com/fei-protocol/fei-protocol-core/wiki/UniswapPCVController)

## Read-Only Functions

```javascript
function isIncentiveParity() external view returns (bool);

function isExemptAddress(address account) external view returns (bool);

function isSellAllowlisted(address account) external view returns (bool);

function TIME_WEIGHT_GRANULARITY() external view returns (uint32);

function getGrowthRate() external view returns (uint32);

function getTimeWeight() external view returns (uint32);

function isTimeWeightActive() external view returns (bool);

function getBuyIncentive(uint256 amount)
    external
    view
    returns (
        uint256 incentive,
        uint32 weight,
        Decimal.D256 memory initialDeviation,
        Decimal.D256 memory finalDeviation
    );

function getSellPenalty(uint256 amount)
    external
    view
    returns (
        uint256 penalty,
        Decimal.D256 memory initialDeviation,
        Decimal.D256 memory finalDeviation
    );
```

## State-Changing Functions <a id="state-changing-functions"></a>

### Governor-Only⚖️

```javascript
function setExemptAddress(address account, bool isExempt) external;

function setSellAllowlisted(address account, bool isAllowed) external;

function setTimeWeightGrowth(uint32 growthRate) external;

function setTimeWeight(
    uint32 weight,
    uint32 growth,
    bool active
) external;
```

### Fei-Only🌲

```javascript
function incentivize(
    address sender,
    address receiver,
    address operator,
    uint256 amountIn
) external
```

