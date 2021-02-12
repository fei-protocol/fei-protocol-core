## Contract
[OracleRef.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/OracleRef.sol)
implements [IOracleRef](https://github.com/fei-protocol/fei-protocol-core/wiki/IOracleRef), [CoreRef](https://github.com/fei-protocol/fei-protocol-core/wiki/CoreRef)

## Description
OracleRef is an abstract contract which references an oracle. It defines some basic utilities useful for contracts referencing an oracle.

## Implementation
The contract allows for updating or reading from the oracle. The oracle price is reported as FEI per X where X is some other asset like ETH, USDC, or USD depending on the oracle needs.

The `invert` function allows for the reporting to be done in the reverse direction.

It allows a governor to update the referenced Oracle