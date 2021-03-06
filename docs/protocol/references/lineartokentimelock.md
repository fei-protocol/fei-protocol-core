---
description: A token timelock that releases continuously at the same rate
---

# LinearTokenTimelock

## Contract

[LinearTokenTimelock.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/utils/LinearTokenTimelock.sol) implements [Timed](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/utils/Timed.sol)

## Description

A timelock for releasing tokens over a continuous linear schedule. There is an appointed beneficiary who controls the tokens when vested. The beneficiary can set a new one if needed using the offer-accept pattern.

### Release Calculation

Uses [Timed](https://github.com/fei-protocol/fei-protocol-core/wiki/Timed) to have a fixed period _d_ of release. The elapsed time _t_ is on the range \[0,d\].

The contract maintains the following:

* `T` - a total token amount which includes any already released and locked tokens. It can increase if new tokens enter the timelock but it cannot decrease.
* `C` - the current held tokens in the contract

The portion of _T_ available for release is _T\*t/d_.

The already released amount is _T - C_.

The net amount available for release is the total available minus already released. The beneficiary can claim these at any time, and distribute to any address.

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

## Read-Only Functions

### lockedToken

```javascript
function lockedToken() external view returns (IERC20);
```

Returns the address of the locked token casted as an IERC20 interface.

### beneficiary

```javascript
function beneficiary() external view returns (address);
```

Returns the current beneficiary address.

### pendingBeneficiary

```javascript
function pendingBeneficiary() external view returns (address);
```

Returns the pending beneficiary, which could assume the beneficiary role at any time by calling `acceptBeneficiary()`

### initialBalance

```javascript
function initialBalance() external view returns (uint256);
```

Returns the initial total amount of locked tokens. If new tokens are dropped into the timelock, this number increases to prevent accounting errors.

### availableForRelease

```javascript
function availableForRelease() external view returns (uint256);
```

The amount of `lockedToken` available to be released by the beneficiary.

### totalToken

```javascript
function totalToken() external view returns(uint256);
```

Returns the total amount of tokens held by the timelock pending release.

### alreadyReleasedAmount

```javascript
function alreadyReleasedAmount() external view returns (uint256);
```

The amount of `lockedToken` already released by the beneficiary.

## Public State-Changing Functions

### acceptBeneficiary

```javascript
function acceptBeneficiary() external;
```

Accepts the beneficiary role for `msg.sender`. Must already be the pending beneficiary.

emits `BeneficiaryUpdate`

## Beneficiary-Only👑 State-Changing Functions

```javascript
function release(address to, uint amount) external;
```

Releases `amount` of timelocked tokens to address `to`. The `amount` must be less than or equal to the released amount of tokens.

emits `Release`

### setPendingBeneficiary

```javascript
function setPendingBeneficiary(address _pendingBeneficiary) external;
```

Sets the pending beneficiary to `_pendingBeneficiary`.

emits `PendingBeneficiaryUpdate`

## ABIs

{% file src="../../.gitbook/assets/lineartokentimelock.json" caption="LinearTokenTimelock ABI" %}

{% file src="../../.gitbook/assets/ilineartokentimelock.json" caption="LinearTokenTimelock Interface ABI" %}

