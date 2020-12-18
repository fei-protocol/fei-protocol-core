pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../external/Decimal.sol";

interface IBondingCurve {

	// ----- External -----

	function purchase(uint256 amountIn, address to) external payable returns (uint256 amountOut);
	
	// ----- Governor Setters -----

	function setBuffer(uint256 _buffer) external;

	function setScale(uint256 _scale) external;

	function setAllocation(address[] calldata allocations, uint256[] calldata ratios) external;

	// ----- Getters -----

	function getCurrentPrice() external view returns(Decimal.D256 memory);

	function getAveragePrice(uint256 amountIn) external view returns (Decimal.D256 memory);

	function getAmountOut(uint256 amountIn) external view returns (uint256 amountOut); 

	function scale() external view returns (uint256);

	function atScale() external view returns (bool);

	function buffer() external view returns(uint256);

	function totalPurchased() external view returns(uint256);

}

