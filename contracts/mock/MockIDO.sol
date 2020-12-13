pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../external/Decimal.sol";

contract MockIDO {

	Decimal.D256 public ratio = Decimal.zero();

	function deploy(Decimal.D256 memory feiRatio) public {
		ratio = feiRatio;
	}
}

