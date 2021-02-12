## Contract
[IDO.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/genesis/IDO.sol)
implements [IDOInterface](https://github.com/fei-protocol/fei-protocol-core/wiki/IDOInterface), [UniRef.sol](https://github.com/fei-protocol/fei-protocol-core/wiki/UniRef), [LinearTokenTimelock](https://github.com/fei-protocol/fei-protocol-core/wiki/LinearTokenTimelock)

## Description
IDO is an Initial DeFi Offering contract for listing FEI and TRIBE at genesis launch.

## [Permissions](https://github.com/fei-protocol/fei-protocol-core/wiki/Permissions)
* Minter

## Implementation
The IDO is deployed by the GenesisGroup contract. The GenesisGroup sets the initial exchange rate. The IDO should hold TRIBE tokens and mint the appropriate amount of FEI to match the given exchange rate. It will then send the TRIBE and FEI to Uniswap where it should be the only LP for the pair.

The LP shares held by the contract vest linearly to the development team over a 4 year window from contract creation.