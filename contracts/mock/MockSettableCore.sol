pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../core/Core.sol";
import "../token/Fii.sol";

contract MockSettableCore is Core {

	constructor()
		Core(address(0), address(0))
	public {
		Fii fii = new Fii(address(this));
		setFii(address(fii));
	}

	// anyone can set any role
	function isGovernor(address _address) public view override returns (bool) {
		return true;
	}
}

