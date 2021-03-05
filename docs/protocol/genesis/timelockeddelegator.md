---
description: A LinearTokenTimelock for TRIBE with the ability to sub-delegate locked tokens
---

# TimelockedDelegator

## Contract

[TimelockedDelegator.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/dao/TimelockedDelegator.sol) implements [ITimelockedDelegator](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/dao/ITimelockedDelegator.sol), [LinearTokenTimelock](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/utils/LinearTokenTimelock.sol)

## Description

A TRIBE token timelock which allows subdelegation. Managed by the Fei Core Team to distribute vested TRIBE and voting rights to team members and investors.

The contract receives TRIBE tokens that vest linearly over a 4 year schedule to a beneficiary. 

{% page-ref page="../references/lineartokentimelock.md" %}

### Sub-Delegation

During the elected timelock period, any TRIBE in the timelock can be sub-delegated to any address. The TimelockedDelegator creates a proxy delegate contract which escrows the TRIBE and sub-delegates. It can then withdraw voting rights at any time. 

The beneficiary decides where to delegate and undelegate. All TRIBE held in the timelock that is not sub-delegated is delegated to the beneficiary.

## Events

{% tabs %}
{% tab title="Delegate" %}
delegate TRIBE tokens from timelock

| type | param | description |
| :--- | :--- | :--- |
| address indexed | \_delegatee | delegatee to recieve the TRIBE votes |
| uint256 | \_amount | amount of TRIBE delegated |
{% endtab %}

{% tab title="Undelegate" %}
Remove TRIBE votes from delegatee

| type | param | description |
| :--- | :--- | :--- |
| address indexed | \_delegatee | delegatee to remove TRIBE votes |
| uint256 | \_amount | amount of TRIBE undelegated |
{% endtab %}
{% endtabs %}

## Read-Only Functions

### delegateContract

```javascript
function delegateContract(address delegatee)
    external
    view
    returns (address);
```

Returns the contract address escrowing and delegating the TRIBE for `delegatee`.

### delegateAmount

```javascript
function delegateAmount(address delegatee) external view returns (uint256);
```

Returns the amount of TRIBE delegated in the escrow contract for `delegatee`

### totalDelegated

```javascript
function totalDelegated() external view returns (uint256);
```

Returns the total amount of TRIBE delegated in proxy contracts, excluding the TRIBE held natively in the TimelockedDelegator.

### tribe

```javascript
function tribe() external view returns (ITribe);
```

A reference to the [TRIBE](../../governance/tribe.md) contract.

## State-Changing Functions <a id="state-changing-functions"></a>

### Beneficiary-Only👑

#### delegate

```javascript
function delegate(address delegatee, uint256 amount) external;
```

Delegates `amount` of TRIBE from the TimelockedDelegator to `delegatee` by creating a proxy and transferring TRIBE to it.

If `delegatee` already has delegation, the TimelockedDelegator undelegates it and increments `amount` before sending to the proxy.

emits `Delegate` and `Undelegate` if the `delegatee` already has some delegated

#### undelegate

```javascript
function undelegate(address delegatee) external returns (uint256);
```

Withdraws all TRIBE from the delegate proxy contract associated with `delegatee` and returns the amount received.

emits `Undelegate`

