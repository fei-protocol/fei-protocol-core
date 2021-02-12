# Tribe

## Contract

[Tribe.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/dao/Tribe.sol)

## Description

The TRIBE governance token.

## Implementation

Forked the [Uniswap UNI](https://etherscan.io/address/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984#code).

Total initial supply is 1 billion. There is minting capability controlled by an appointed minter address \(this is different from the Minter role\).

The TRIBE token also supports "permit" used for metatransactions: function permit\(address owner, address spender, uint value, uint deadline, uint8 v, bytes32 r, bytes32 s\) external

