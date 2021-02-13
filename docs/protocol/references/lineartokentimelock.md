# LinearTokenTimelock

## Contract

[LinearTokenTimelock.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/utils/LinearTokenTimelock.sol) implements [Timed](https://github.com/fei-protocol/fei-protocol-core/wiki/Timed)

## Description

A timelock for releasing tokens over a continuous linear schedule.

## Events

{% tabs %}
{% tab title="Release" %}
A release of timelocked tokens

| type | param | description |
| :--- | :--- | :--- |
| address indexed | \_beneficiary | the address that owns the timelocked tokens |
| address indexed | \_recipient | the address receiving this unlocked distribution |
| uint256 | \_amount | the amount of unlocked tokens released |
{% endtab %}

{% tab title="BeneficiaryUpdate" %}
A change in beneficiary to the timelock

| type | param | description |
| :--- | :--- | :--- |
| address indexed | \_beneficiary | the new beneficiary address |
{% endtab %}

{% tab title="PendingBeneficiaryUpdate" %}
A change in pending beneficiary to the timelock

| type | param | description |
| :--- | :--- | :--- |
| address indexed | \_pendingBeneficiary | the new beneficiary address |
{% endtab %}
{% endtabs %}

## Implementation

Uses [Timed](https://github.com/fei-protocol/fei-protocol-core/wiki/Timed) to have a fixed period _d_ of release. _t_ is the timestamp on \[0,d\].

There is an appointed beneficary who received the tokens when vested. The beneficiary can set the new one if needed using the offer accept pattern.

The contract maintains the following:

* `T` - a total token amount which includes any released and locked tokens. It can increase if new tokens enter the timelock but it cannot decrease.
* `C` - the current held tokens in the contract

The portion of _T_ available for release is _Tt/d_.

The already released amount is _T - C_.

The net amount available for release is the total available minus already released. The beneficiary can claim these at any time.

## Read-Only Functions

```javascript
function lockedToken() external view returns (IERC20);

function beneficiary() external view returns (address);

function pendingBeneficiary() external view returns (address);

function initialBalance() external view returns (uint256);

function availableForRelease() external view returns (uint256);

function totalToken() external view returns(uint256);

function alreadyReleasedAmount() external view returns (uint256);
```

## State-Changing Functions <a id="state-changing-functions"></a>

### Beneficiary-Only👑

```javascript
function release(address to, uint amount) external;

function setPendingBeneficiary(address _pendingBeneficiary) external;

function acceptBeneficiary() external;
```

