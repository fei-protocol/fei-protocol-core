pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../oracle/IOracle.sol";
import "../external/Decimal.sol";

/// @title A oracle Reference contract
/// @author Fei Protocol
/// @notice defines some utilities around interacting with the referenced oracle
interface IOracleRef {

	// ----------- Events -----------

	event OracleUpdate(address indexed _oracle);

	// ----------- State changing API -----------

	/// @notice updates the referenced oracle
	/// @return true if the update is effective
	function updateOracle() external returns(bool);

	// ----------- Governor only state changing API -----------

	/// @notice sets the referenced oracle
	/// @param _oracle the new oracle to reference
	function setOracle(address _oracle) external;

	// ----------- Getters -----------

	/// @notice the oracle reference by the contract
	/// @return the IOracle implementation address
	function oracle() external view returns(IOracle);

	/// @notice the peg price of the referenced oracle
	/// @return the peg as a Decimal
	/// @dev the peg is defined as FEI per X with X being ETH, dollars, etc
	function peg() external view returns(Decimal.D256 memory);

	/// @notice invert a peg price
	/// @param price the peg price to invert
	/// @return the inverted peg as a Decimal
	/// @dev the inverted peg would be X per FEI
	function invert(Decimal.D256 calldata price) external pure returns(Decimal.D256 memory);
}