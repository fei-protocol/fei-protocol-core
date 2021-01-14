pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../external/Decimal.sol";

interface IBondingCurve {

	// ----------- Events -----------

    event ScaleUpdate(uint _scale);

    event BufferUpdate(uint _buffer);

    event Purchase(address indexed _to, uint _amountIn, uint _amountOut);

	event Allocate(address indexed _caller, uint _amount);

	// ----------- State changing Api -----------

	/// @notice purchase FEI for underlying tokens
	/// @param to address to receive FEI
	/// @param amountIn amount of underlying tokens input
	/// @return amountOut amount of FEI received
	function purchase(address to, uint amountIn) external payable returns (uint amountOut);
	
	/// @notice batch allocate held PCV
	function allocate() external;

	// ----------- Governor only state changing api -----------

	/// @notice sets the bonding curve price buffer
	function setBuffer(uint _buffer) external;

	/// @notice sets the bonding curve Scale target
	function setScale(uint _scale) external;

	/// @notice sets the allocation of incoming PCV
	function setAllocation(address[] calldata pcvDeposits, uint[] calldata ratios) external;

	// ----------- Getters -----------

	/// @notice return current instantaneous bonding curve price 
	/// @return price reported as FEI per X with X being the underlying asset
	function getCurrentPrice() external view returns(Decimal.D256 memory);

	/// @notice return the average price of a transaction along bonding curve
	/// @param amountIn the amount of underlying used to purchase
	/// @return price reported as FEI per X with X being the underlying asset
	function getAveragePrice(uint amountIn) external view returns (Decimal.D256 memory);

	/// @notice return amount of FEI received after a bonding curve purchase
	/// @param amountIn the amount of underlying used to purchase
	/// @return amountOut the amount of FEI received
	function getAmountOut(uint amountIn) external view returns (uint amountOut); 

	/// @notice the Scale target at which bonding curve price fixes
	function scale() external view returns (uint);

	/// @notice a boolean signalling whether Scale has been reached
	function atScale() external view returns (bool);

	/// @notice the buffer applied on top of the peg purchase price once at Scale
	function buffer() external view returns(uint);

	/// @notice the total amount of FEI purchased on bonding curve. FEI_b from the whitepaper
	function totalPurchased() external view returns(uint);

	/// @notice the amount of PCV held in contract and ready to be allocated
	function getTotalPCVHeld() external view returns(uint);

	/// @notice amount of FEI paid for allocation when incentivized
	function incentiveAmount() external view returns(uint);
}

