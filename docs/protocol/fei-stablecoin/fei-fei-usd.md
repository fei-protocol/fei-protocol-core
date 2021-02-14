---
description: The Fei USD stablecoin
---

# FEI \(Fei USD\)

## Contract

[Fei.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/token/Fei.sol) implements [IFei.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/token/IFei.sol), [CoreRef](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/CoreRef.sol), [ERC20Burnable](https://docs.openzeppelin.com/contracts/3.x/api/token/erc20#ERC20Burnable)

## Description

FEI is a normal ERC-20 using the OpenZeppelin ERC-20Burnable code with the following differences:

Minting and burning to any address are uncapped and accessible by any address with the Minter💰and Burner🔥 role, respectively.

At each transfer \(or transferFrom\) the following addresses are checked for a mapped incentive contract:

* FEI sender
* FEI receiver
* FEI operator \(msg.sender\) - usually the same as the sender unless using transferFrom with an approved contract
* the zero address - representing an incentive to be applied on ALL transfers

If an incentive contract is found, it is called with all of the transfer parameters. Any incentive is applied after the token balances update from the transfer.

## Events

{% tabs %}
{% tab title="Minting" %}
Minting FEI to an address

| type | param | description |
| :--- | :--- | :--- |
| address indexed |  \_to | The recipient of the minted FEI |
| address indexed | \_minter | The contract that minted the FEI |
| uint256 | \_amount | The amount of FEI minted |
{% endtab %}

{% tab title="Burning" %}
Burning FEI from an address

| type | param | description |
| :--- | :--- | :--- |
| address indexed |  \_to | The target of the burned FEI |
| address indexed | \_burner | The contract that burned the FEI |
| uint256 | \_amount | The amount of FEI minted |
{% endtab %}

{% tab title="IncentiveContractUpdate" %}
setting or unsetting an incentive contract for an incentivized address

| type | param | description |
| :--- | :--- | :--- |
| address indexed |  \_incentivized | The incentivized address |
| address indexed | \_incentiveContract | The new incentive contract. address\(0\) to unset |
{% endtab %}
{% endtabs %}

## Read-Only Functions

```javascript
function incentiveContract(address account) external view returns (address);
```

## State-Changing Functions <a id="state-changing-functions"></a>

### Burner-Only🔥 

```javascript
function burnFrom(address account, uint256 amount) external;
```

### Minter-Only💰 

```javascript
function mint(address account, uint256 amount) external;
```

### Governor-Only⚖️ 

```javascript
function setIncentiveContract(address account, address incentive) external;
```

### Public

```javascript
function burn(uint256 amount) external;

function permit(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
) external;
```



