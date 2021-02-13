# UniRef

## Contract

[UniRef.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/UniRef.sol) implements [IUniRef](https://github.com/fei-protocol/fei-protocol-core/wiki/IUniRef), [OracleRef](https://github.com/fei-protocol/fei-protocol-core/wiki/OracleRef)

## Description

UniRef is an abstract contract which references a Uniswap pool. It defines some basic utilities useful for contracts referencing Uniswap. It leverages the OracleRef contract to calculate various quantities relating to spot vs peg price

## Events

{% tabs %}
{% tab title="PairUpdate" %}
Referenced Uniswap pair contract update

| type | param | description |
| :--- | :--- | :--- |
| address indexed | \_pair | new Uniswap pair contract |
{% endtab %}
{% endtabs %}

## Implementation

The contract allows for calculating uniswap quantities:

* getReserves orders the reserves as \(fei, other\) and returns them. If the FEI balance of the pair contract exceeds the reserves, it uses the balance instead. This mitigates attack vectors which leverage multiple small uniswap transfers before executing a swap operation to evade burn fees.
* returning the LP owned by the contract and ratio of LP owned to total LP
* returning current uniswap price of FEI/ETH. This is simply the division of FEI reserves by ETH reserves.
* get price after a hypothetical trade of a predetermined size. To calculate the size of the trade we need to take a delta in FEI _dFEI_ and apply it to the FEI reserves _R\_f_. Then we need to calculate the new ETH reserves \*R\_e based on the invariant. Finally we divide new FEI by new reserves. To summarize:

  _R\_e = k / \(R\_f + dFEI\)_ and _P = R\_e / \(R\_f + dFEI\)_

It also has utilities relating to the peg _O_:

* Check whether below peg or not
* Get amount of a certain asset \(fei or other\) _dTarget_ to trade to bring back to peg. Let _R\_t_ be reserves of target asset before trade and _R\_o_ be the other asset.

The goal is _\(R\_t + dTarget\)/\(R\_o - dOther\) = \(R\_t + dTarget\)^2 / k = O_ because this sets the new price post dTarget to O. Solving for \_dTarget= Sqrt\(O\_k\) - R\_t\*. We take the absolute value here and infer the direction based on whether above or below peg.

* get the price deviation from peg before and after a hypothetical trade. The deviation is defined as _abs\(P - O / O\)_. The protocol only needs to know the deviation when underpegged. Therefore at or above the peg returns 0 for the deviation. 

## Read-Only Functions

## State-Changing Functions <a id="state-changing-functions"></a>

### Governor-Only 

### GenesisGroup-Only

