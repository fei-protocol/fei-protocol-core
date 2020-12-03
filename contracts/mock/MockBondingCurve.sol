pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../external/Decimal.sol";

contract MockBondingCurve {

	uint256 public price;
	bool public atScale;
	Decimal.D256 public getCurrentPrice;

	constructor(bool _atScale, uint256 price) public {
		setScale(_atScale);
		setCurrentPrice(price);
	}

	function setScale(bool _atScale) public {
		atScale = _atScale;
	}

	function setCurrentPrice(uint256 price) public {
		getCurrentPrice = Decimal.from(price);
	}
}