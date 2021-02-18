pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../external/Decimal.sol";

contract MockBondingCurveOracle {
	Decimal.D256 public initPrice;

	function init(Decimal.D256 memory price) public {
		initPrice = price;
	}
}