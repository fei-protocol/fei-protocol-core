# IBondingCurve

## Interface

[IBondingCurve.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/bondingcurve/IBondingCurve.sol)

## Events

`Allocate(address indexed _caller, uint amount)` - Allocate held PCV

* `_caller` - the sender of the allocation transaction
* `amount` - the amount of PCV allocated

`ScaleUpdate(uint _scale)` - Governance change of Scale target

* `_scale` - new Scale target

`BufferUpdate(uint _buffer)` - Governance change of Buffer

* `_buffer` - new buffer

`Purchase(address indexed _to, uint _amountIn, uint _amountOut)` - Purchase of FEI on Bonding Curve

* `_to` - recipient of FEI
* `amountIn` - amount of purchase asset
* `amountOut` - amount of FEI

## Description

Bonding curve interface for purchasing FEI. See the contract commented documentation for a description of the API.

