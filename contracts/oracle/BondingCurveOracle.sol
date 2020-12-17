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
	bool public killSwitch;

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

	function update() external override returns (bool) {
		return uniswapOracle.update();
	}

    function read() external view override returns (Decimal.D256 memory, bool) {
    	if (killSwitch) {
    		return (Decimal.zero(), false);
    	}
    	if (bondingCurve.atScale()) {
    		return uniswapOracle.read();
    	}
    	return (bondingCurve.getCurrentPrice(), true);
    }
}