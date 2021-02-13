# TimelockedDelegator

## Contract

[TimelockedDelegator.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/dao/TimelockedDelegator.sol) implements [ITimelockedDelegator](https://github.com/fei-protocol/fei-protocol-core/wiki/ITimelockedDelegator), [LinearTokenTimelock](https://github.com/fei-protocol/fei-protocol-core/wiki/LinearTokenTimelock)

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

## Description

A token timelock for TRIBE which allows for subdelegation.

## Implementation

The contract should receive TRIBE tokens that vest linearly over a 4 year schedule to a beneficiary. During this period, any TRIBE held in the timelock can be sub delegated to any address. The beneficiary decides where to delegate and undelegate. All TRIBE held in the timelock that is not sub delegated is delegated to the beneficiary.

## Read-Only Functions

## State-Changing Functions <a id="state-changing-functions"></a>

### Governor-Only 

### GenesisGroup-Only

