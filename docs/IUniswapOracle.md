## Interface
[IUniswapOracle.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/oracle/IUniswapOracle.sol)
implements [IOracle.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/oracle/IOracle.sol)

## Events
`DurationUpdate(uint _duration)` - New TWAP duration
* `_duration` - new value of the TWAP duration

## Description
Oracle maintaining a Uniswap TWAP over a fixed duration. See the contract commented documentation for a description of the API.