pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IBondingCurveOracle.sol";
import "../refs/CoreRef.sol";
import "../utils/Timed.sol";

/// @title IBondingCurveOracle implementation contract
/// @author Fei Protocol
/// @notice includes "thawing" on the initial purchase price at genesis. Time weights price from initial to true peg over a window.
contract BondingCurveOracle is IBondingCurveOracle, CoreRef, Timed {
	using Decimal for Decimal.D256;

	IOracle public override uniswapOracle;
	IBondingCurve public override bondingCurve;

	bool public override killSwitch = true;

	Decimal.D256 internal _initialPrice;

	/// @notice BondingCurveOracle constructor
	/// @param _core Fei Core to reference
	/// @param _oracle Uniswap Oracle to report from
	/// @param _bondingCurve Bonding curve to report from
	/// @param _duration price thawing duration
	constructor(
		address _core, 
		address _oracle, 
		address _bondingCurve, 
		uint _duration
	) public CoreRef(_core) Timed(_duration) {
		uniswapOracle = IOracle(_oracle);
		bondingCurve = IBondingCurve(_bondingCurve);
	}

	function update() external override returns (bool) {
		return uniswapOracle.update();
	}

	function isOutdated() external view override returns(bool) {
		return uniswapOracle.isOutdated();
	}

    function read() external view override returns (Decimal.D256 memory, bool) {
    	if (killSwitch) {
    		return (Decimal.zero(), false);
    	}
    	(Decimal.D256 memory peg, bool valid) = getOracleValue();
    	return (thaw(peg), valid);
    }

	function setKillSwitch(bool _killSwitch) external override onlyGovernor {
		killSwitch = _killSwitch;
		emit KillSwitchUpdate(_killSwitch);
	}

	function init(Decimal.D256 memory initialPrice) public override onlyGenesisGroup {
    	killSwitch = false;

    	_initialPrice = initialPrice;

		_initTimed();
    }

	function initialPrice() external override returns(Decimal.D256 memory) {
		return _initialPrice;
	}

    function thaw(Decimal.D256 memory peg) internal view returns (Decimal.D256 memory) {
    	if (isTimeEnded()) {
    		return peg;
    	}
		uint elapsed = timeSinceStart();
		uint remaining = remainingTime();

    	(Decimal.D256 memory uniswapPeg,) = uniswapOracle.read();
    	Decimal.D256 memory price = uniswapPeg.div(peg);

    	Decimal.D256 memory weightedPrice = _initialPrice.mul(remaining).add(price.mul(elapsed)).div(duration);
    	return uniswapPeg.div(weightedPrice);
    }

    function getOracleValue() internal view returns(Decimal.D256 memory, bool) {
    	if (bondingCurve.atScale()) {
    		return uniswapOracle.read();
    	}
    	return (bondingCurve.getCurrentPrice(), true);
    }
}