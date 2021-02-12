# UniswapOracle

## Contract

[UniswapOracle.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/oracle/UniswapOracle.sol) implements [IUniswapOracle](https://github.com/fei-protocol/fei-protocol-core/wiki/IUniswapOracle), [CoreRef](https://github.com/fei-protocol/fei-protocol-core/wiki/CoreRef)

## Description

The UniswapOracle contract maintains a uniswap TWAP.

## Events

`KillSwitchUpdate(uint _killSwitch)` - Oracle kill switch change

* `_killSwitch` - new value of the kill switch flag

`Update(uint _peg)` - new reported peg

* `_peg` - new peg value

`DurationUpdate(uint _duration)` - New TWAP duration

* `_duration` - new value of the TWAP duration

## Implementation

Maintains a pair contract to reference and a flag for whether the target price is token0 or token1 of the pair. Has a timestamp duration which must be exceeded between oracle updates. This duration is 10 minutes at launch.

Updates should:

* take the difference between the current and prior timestamp and make sure it exceeds the duration
* get the cumulative price difference between Eth and USDC and normalize by 10\*\*12 \(the decimal difference between them\)
* divide 2^112 by the ratio between the cumulative price and timestamp to get a peg price.
* update the peg and prior cumulative and timestamp

The governor can change the duration if needed.

