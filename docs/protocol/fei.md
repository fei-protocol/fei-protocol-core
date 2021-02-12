# Fei

## Contract

[Fei.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/token/Fei.sol) implements [IFei.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/token/IFei.sol), [CoreRef](https://github.com/fei-protocol/fei-protocol-core/wiki/CoreRef), [ERC20](https://docs.openzeppelin.com/contracts/3.x/api/token/erc20#ERC20), [ERC20Burnable](https://docs.openzeppelin.com/contracts/3.x/api/token/erc20#ERC20Burnable)

## Events

{% tabs %}
{% tab title="Minting" %}
| type | param | description |
| :--- | :--- | :--- |
| address indexed |  \_to | The recipient of the minted FEI |
| address indexed | \_minter | The contract that minted the FEI |
| uint256 | \_amount | The amount of FEI minted |
{% endtab %}

{% tab title="Burning" %}
| type | param | description |
| :--- | :--- | :--- |
| address indexed |  \_to | The target of the burned FEI |
| address indexed | \_burner | The contract that burned the FEI |
| uint256 | \_amount | The amount of FEI minted |
{% endtab %}

{% tab title="IncentiveContractUpdate" %}
| type | param | description |
| :--- | :--- | :--- |
| address indexed |  \_incentivized | The incentivized address |
| address indexed | \_incentiveContract | The new incentive contract |
{% endtab %}
{% endtabs %}

## Description

The FEI token is the stablecoin produced by Fei Protocol. It has dynamic incentives applied on transfers controlled by Minters and Burners.

## Implementation

FEI should have an unlimited supply. It can be minted by any contract with the Minter permissions. It can also be burned from any address by any contract with Burner permissions.

At each transfer \(or transferFrom\) the following addresses are checked for a mapped incentive contract:

* FEI sender
* FEI receiver
* FEI operator \(msg.sender\) - usually the same as the sender unless using transferFrom with an approved contract
* the zero address - representing an incentive to be applied on ALL transfers

If an incentive contract is found, it is called with all of the transfer parameters. Any incentive is applied BEFORE the token balances update in the Fei contract.

Governance can set incentive contracts for any address.

The FEI token also supports "permit" used for metatransactions: `function permit(address owner, address spender, uint value, uint deadline, uint8 v, bytes32 r, bytes32 s) external`

