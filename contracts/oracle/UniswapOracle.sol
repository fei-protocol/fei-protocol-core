
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

// Referencing Uniswap Example Simple Oracle
// https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/examples/ExampleOracleSimple.sol

import "@uniswap/v2-periphery/contracts/libraries/UniswapV2OracleLibrary.sol";
import "./IUniswapOracle.sol";
import "../refs/CoreRef.sol";

/// @title IUniswapOracle implementation contract
/// @author Fei Protocol
contract UniswapOracle is IUniswapOracle, CoreRef {
	using Decimal for Decimal.D256;

	IUniswapV2Pair public override pair;
	bool private isPrice0;

	uint public override priorCumulative; 
	uint32 public override priorTimestamp;

	Decimal.D256 private twap = Decimal.zero();
	uint32 public override duration;

	bool public override killSwitch;

	/// @notice UniswapOracle constructor
	/// @param _core Fei Core for reference
	/// @param _pair Uniswap Pair to provide TWAP
	/// @param _duration TWAP duration
	/// @param _isPrice0 flag for using token0 or token1 for cumulative on Uniswap
	constructor(
		address _core, 
		address _pair, 
		uint32 _duration,
		bool _isPrice0
	) public CoreRef(_core) {
		pair = IUniswapV2Pair(_pair);
		// Relative to USD per ETH price
		isPrice0 = _isPrice0;

		duration = _duration;

		_init();
	}

	function update() external override returns (bool) {
		(uint price0Cumulative, uint price1Cumulative, uint32 currentTimestamp) =
            UniswapV2OracleLibrary.currentCumulativePrices(address(pair));

		uint32 deltaTimestamp = currentTimestamp - priorTimestamp;
		if(currentTimestamp <= priorTimestamp || deltaTimestamp < duration) {
			return false;
		}

		uint currentCumulative = _getCumulative(price0Cumulative, price1Cumulative);
		uint deltaCumulative = (currentCumulative - priorCumulative) / 1e12;

		Decimal.D256 memory _twap = Decimal.ratio(2**112, deltaCumulative / deltaTimestamp);
		twap = _twap;

		priorTimestamp = currentTimestamp;
		priorCumulative = currentCumulative;

		emit Update(_twap.asUint256());

		return true;
	}

    function read() external view override returns (Decimal.D256 memory, bool) {
    	bool valid = !(killSwitch || twap.isZero());
    	return (twap, valid);
    }
 
	function setKillSwitch(bool _killSwitch) external override onlyGovernor {
		killSwitch = _killSwitch;
		emit KillSwitchUpdate(_killSwitch);
	}

	function setDuration(uint32 _duration) external override onlyGovernor {
		duration = _duration;
		emit DurationUpdate(_duration);
	}

	function _init() internal {
        uint price0Cumulative = pair.price0CumulativeLast();
        uint price1Cumulative = pair.price1CumulativeLast();

        (,, uint32 currentTimestamp) = pair.getReserves();

        priorTimestamp = currentTimestamp;
		priorCumulative = _getCumulative(price0Cumulative, price1Cumulative);
	}

    function _getCumulative(uint price0Cumulative, uint price1Cumulative) internal view returns (uint) {
		return isPrice0 ? price0Cumulative : price1Cumulative;
	}
}