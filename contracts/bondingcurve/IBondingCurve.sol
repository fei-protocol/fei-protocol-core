pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../external/Decimal.sol";

interface IBondingCurve {

	function purchase(uint256 amountIn, address to) external payable returns (uint256 amountOut);

	function setScale(uint256 _scale) external;

	function scale() external view returns (uint256 _scale);

	function atScale() external view returns (bool);

	function getCurrentPrice() external view returns(Decimal.D256 memory);

	function getAmountOut(uint256 amountIn) external view returns (uint256 amountOut); 

}

