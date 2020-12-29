pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../external/Decimal.sol";

interface IOracleRef {
	function setOracle(address _oracle) external;
	function updateOracle() external returns(bool);
	function peg() external view returns(Decimal.D256 memory);
}