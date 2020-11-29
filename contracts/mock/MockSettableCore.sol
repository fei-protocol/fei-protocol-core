pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../core/Core.sol";
import "../token/Fei.sol";

contract MockSettableCore is Core {

	// anyone can set any role
	function isGovernor(address _address) public view override returns (bool) {
		return true;
	}
}

