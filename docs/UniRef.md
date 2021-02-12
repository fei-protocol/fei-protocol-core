## Contract
[UniRef.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/UniRef.sol)
implements [IUniRef](https://github.com/fei-protocol/fei-protocol-core/wiki/IUniRef), [OracleRef](https://github.com/fei-protocol/fei-protocol-core/wiki/OracleRef)

## Description
UniRef is an abstract contract which references a Uniswap pool. It defines some basic utilities useful for contracts referencing Uniswap. It leverages the OracleRef contract to calculate various quantities relating to spot vs peg price

## Implementation
The contract allows for calculating uniswap quantities:
* getReserves orders the reserves as (fei, other) and returns them. If the FEI balance of the pair contract exceeds the reserves, it uses the balance instead. This mitigates attack vectors which leverage multiple small uniswap transfers before executing a swap operation to evade burn fees.
* returning the LP owned by the contract and ratio of LP owned to total LP
* returning current uniswap price of FEI/ETH. This is simply the division of FEI reserves by ETH reserves.
* get price after a hypothetical trade of a predetermined size. To calculate the size of the trade we need to take a delta in FEI *dFEI* and apply it to the FEI reserves *R_f*. Then we need to calculate the new ETH reserves *R_e based on the invariant. Finally we divide new FEI by new reserves. To summarize:
*R_e = k / (R_f + dFEI)* and *P = R_e / (R_f + dFEI)*

It also has utilities relating to the peg *O*:
* Check whether below peg or not
* Get amount of a certain asset (fei or other) *dTarget* to trade to bring back to peg. Let *R_t* be reserves of target asset before trade and *R_o* be the other asset.
 
The goal is *(R_t + dTarget)/(R_o - dOther) = (R_t + dTarget)^2 / k = O* because this sets the new price post dTarget to O. Solving for *dTarget= Sqrt(O*k) - R_t*. We take the absolute value here and infer the direction based on whether above or below peg. 

* get the price deviation from peg before and after a hypothetical trade. The deviation is defined as *abs(P - O / O)*. The protocol only needs to know the deviation when underpegged. Therefore at or above the peg returns 0 for the deviation. 

 

