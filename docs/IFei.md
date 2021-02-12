## Interface
[IFei.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/token/IFei.sol)

## Events
`Minting(address indexed _to, address indexed _minter, uint _amount)` - FEI Minting
* `_to` - recipient of minted FEI
* `_minter` - minter of the FEI
* `_amount` - amount of FEI minted

`Burning(address indexed _to, address indexed _burner, uint _amount)` - FEI Burning
* `_to` - address of burned FEI
* `_burner` - burner of the FEI
* `_amount` - amount of FEI burned

`IncentiveContractUpdate(address indexed _incentivized, address indexed _incentiveContract)` - Incentive Contract change
* `_incentivized` - incentivized address
* `_incentiveContract` - new incentive contract

## Description
FEI stablecoin. See the contract commented documentation for a description of the API.