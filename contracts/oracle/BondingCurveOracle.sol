pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IOracle.sol";
import "../bondingcurve/IBondingCurve.sol";
import "../external/Decimal.sol";
import "../refs/CoreRef.sol";

contract BondingCurveOracle is IOracle, CoreRef {
	using Decimal for Decimal.D256;

	IOracle public uniswapOracle;
	IBondingCurve public bondingCurve;
	bool public killSwitch = true;

	Decimal.D256 public initialPrice;
	uint public startTime;
	uint public duration = 4 weeks;

	event KillSwitchUpdate(bool _killSwitch);

	constructor(address _core, address _oracle, address _bondingCurve) public
		CoreRef(_core)
	{
		uniswapOracle = IOracle(_oracle);
		bondingCurve = IBondingCurve(_bondingCurve);
	}

	function setKillSwitch(bool _killSwitch) public onlyGovernor {
		killSwitch = _killSwitch;
		emit KillSwitchUpdate(_killSwitch);
	}

	function init(Decimal.D256 memory initialPeg) public onlyGenesisGroup {
    	killSwitch = false;
    	(Decimal.D256 memory uniswapPeg,) = uniswapOracle.read();
    	initialPrice = uniswapPeg.div(initialPeg);
        // solhint-disable-next-line not-rely-on-time
    	startTime = now;
    }

	function update() external override returns (bool) {
		return uniswapOracle.update();
	}

    function read() external view override returns (Decimal.D256 memory, bool) {
    	if (killSwitch) {
    		return (Decimal.zero(), false);
    	}
    	(Decimal.D256 memory peg, bool valid) = getOracleValue();
    	return (thaw(peg), valid);
    }

    function thaw(Decimal.D256 memory peg) internal view returns (Decimal.D256 memory) {
    	uint t = time();
    	if (t >= duration) {
    		return peg;
    	}
    	(Decimal.D256 memory uniswapPeg,) = uniswapOracle.read();
    	Decimal.D256 memory price = uniswapPeg.div(peg);

    	Decimal.D256 memory weightedPrice = initialPrice.mul(duration - t).add(price.mul(t)).div(duration);
    	return uniswapPeg.div(weightedPrice);
    }

    function time() internal view returns (uint) {
        // solhint-disable-next-line not-rely-on-time
    	return now - startTime;
    }

    function getOracleValue() internal view returns(Decimal.D256 memory, bool) {
    	if (bondingCurve.atScale()) {
    		return uniswapOracle.read();
    	}
    	return (bondingCurve.getCurrentPrice(), true);
    }
}