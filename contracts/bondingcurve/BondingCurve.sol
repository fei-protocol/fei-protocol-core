pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IBondingCurve.sol";
import "../utils/Roots.sol";
import "../refs/OracleRef.sol";
import "../pcv/PCVSplitter.sol";

/// @title an abstract bonding curve for purchasing FEI
/// @author Fei Protocol
abstract contract BondingCurve is IBondingCurve, OracleRef, PCVSplitter {
    using Decimal for Decimal.D256;
    using Roots for uint;

	uint public override scale;
	uint public override totalPurchased; // FEI_b for this curve

	uint public override buffer = 100;
	uint public constant BUFFER_GRANULARITY = 10_000;

	/// @notice constructor
	/// @param _scale the Scale target where peg fixes
	/// @param _core Fei Core to reference
	/// @param _pcvDeposits the PCV Deposits for the PCVSplitter
	/// @param _ratios the ratios for the PCVSplitter
	/// @param _oracle the UniswapOracle to reference
	constructor(
		uint _scale, 
		address _core, 
		address[] memory _pcvDeposits, 
		uint[] memory _ratios, 
		address _oracle
	) public
		OracleRef(_core, _oracle)
		PCVSplitter(_pcvDeposits, _ratios)
	{
		_setScale(_scale);
	}

	function setScale(uint _scale) public override onlyGovernor {
		_setScale(_scale);
		emit ScaleUpdate(_scale);
	}

	function setBuffer(uint _buffer) public override onlyGovernor {
		require(_buffer < BUFFER_GRANULARITY, "BondingCurve: Buffer exceeds or matches granularity");
		buffer = _buffer;
		emit BufferUpdate(_buffer);
	}

	function setAllocation(address[] memory allocations, uint[] memory ratios) public override onlyGovernor {
		_setAllocation(allocations, ratios);
	}

	function atScale() public override view returns (bool) {
		return totalPurchased >= scale;
	}

	function getCurrentPrice() public view override returns(Decimal.D256 memory) {
		if (atScale()) {
			return peg().mul(_getBuffer());
		}
		return peg().div(_getBondingCurvePriceMultiplier());
	}

	function getAmountOut(uint amountIn) public view override returns (uint amountOut) {
		uint adjustedAmount = getAdjustedAmount(amountIn);
		if (atScale()) {
			return _getBufferAdjustedAmount(adjustedAmount);
		}
		return _getBondingCurveAmountOut(adjustedAmount);
	}

	function getAveragePrice(uint amountIn) public view override returns (Decimal.D256 memory) {
		uint adjustedAmount = getAdjustedAmount(amountIn);
		uint amountOut = getAmountOut(amountIn);
		return Decimal.ratio(adjustedAmount, amountOut);
	}

	function getAdjustedAmount(uint amountIn) internal view returns (uint) {
		return peg().mul(amountIn).asUint256();
	}

	function _purchase(uint amountIn, address to) internal returns (uint amountOut) {
	 	updateOracle();
		
	 	amountOut = getAmountOut(amountIn);
	 	incrementTotalPurchased(amountOut);
		fei().mint(to, amountOut);

		_allocate(amountIn);

		emit Purchase(to, amountIn, amountOut);

		return amountOut;
	}

	function incrementTotalPurchased(uint amount) internal {
		totalPurchased += amount;
	}

	function _setScale(uint _scale) internal {
		scale = _scale;
	}

	function _getBondingCurvePriceMultiplier() internal view virtual returns(Decimal.D256 memory);

	function _getBondingCurveAmountOut(uint adjustedAmountIn) internal view virtual returns(uint);

	function _getBuffer() internal view returns(Decimal.D256 memory) {
		uint granularity = BUFFER_GRANULARITY;
		return Decimal.ratio(granularity - buffer, granularity);
	} 

	function _getBufferAdjustedAmount(uint amountIn) internal view returns(uint) {
		return _getBuffer().mul(amountIn).asUint256();
	}
}