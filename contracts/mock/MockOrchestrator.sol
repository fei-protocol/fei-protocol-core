pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../external/Decimal.sol";

contract MockBCO {
	Decimal.D256 public initPrice;

	function init(Decimal.D256 memory price) public {
		initPrice = price;
	}
}

contract MockPool {
	bool public initialized;
	function init() public {
		initialized = true;
	}
}

contract MockOrchestrator {
	address public bondingCurveOracle;
	address public pool;

	constructor() public {
		bondingCurveOracle = address(new MockBCO());

		pool = address(new MockPool());
	}

    function launchGovernance() external {}
}