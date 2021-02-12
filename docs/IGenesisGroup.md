## Interface
[IGenesisGroup.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/genesis/IGenesisGroup.sol)

## Events
`Purchase(address indexed _to, uint _value)` - A purchase into the Genesis Group
* `_to` - the address to send Fei Genesis ownership tokens (FGEN) to
*  `_value` - the amount of ETH deposited

`Redeem(address indexed _to, uint _amountIn, uint _amountFei, uint _amountTribe)` - Redeem Fei Genesis ownership tokens (FGEN) for FEI and TRIBE
* `_to` - the address to send TRIBE and FEI to
* `_amountIn` - the amount of FGEN redeemed
* `_amountFei` - the amount of FEI received
* `_amountTribe` - the amount of TRIBE received

`Launch(uint _timestamp)` - The completion of the Genesis Group and launch of Fei Protocol. Only emitted once
* `_timestamp` - the block timestamp of deployment

## Description
Genesis Group for the first bonding curve transaction. See the contract commented documentation for a description of the API.