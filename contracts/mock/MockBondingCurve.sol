pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../external/Decimal.sol";

contract MockBondingCurve {

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
		getCurrentPrice = Decimal.ratio(price, 100);
	}

	function purchase(uint amount, address to) public payable returns (uint256 amountOut) {
		return 1;
	}

	function getAmountOut(uint amount) public view returns(uint) {
		return 10 * amount;
	}

	function getAveragePrice(uint256 amountIn) public view returns (Decimal.D256 memory) {
		return getCurrentPrice;
	}
}