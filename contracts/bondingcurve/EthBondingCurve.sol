pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./BondingCurve.sol";
import "../pcv/IPCVDeposit.sol";

/// @title a square root growth bonding curve for purchasing FEI with ETH
/// @author Fei Protocol
contract EthBondingCurve is BondingCurve {

	uint internal immutable SHIFT; // k shift

	constructor(
		uint scale, 
		address core, 
		address[] memory pcvDeposits, 
		uint[] memory ratios, 
		address oracle,
		uint32 duration,
		uint incentive
	) public BondingCurve(
			scale, 
			core, 
			pcvDeposits, 
			ratios, 
			oracle, 
			duration,
			incentive
	) {
		SHIFT = scale / 3; // Enforces a .50c starting price per bonding curve formula
	}

	function purchase(address to, uint amountIn) external override payable postGenesis returns (uint amountOut) {
		require(msg.value == amountIn, "Bonding Curve: Sent value does not equal input");
		return _purchase(amountIn, to);
	}

	function getTotalPCVHeld() public view override returns(uint) {
		return address(this).balance;
	}

	// Represents the integral solved for upper bound of P(x) = ((k+X)/(k+S))^1/2 * O. Subtracting starting point C
	function _getBondingCurveAmountOut(uint adjustedAmountIn) internal view override returns (uint amountOut) {
		uint shiftTotal = _shift(totalPurchased); // k + C
		uint radicand = (3 * adjustedAmountIn * _shift(scale).sqrt() / 2) + shiftTotal.threeHalfsRoot();
		return radicand.twoThirdsRoot() - shiftTotal; // result - (k + C)
	}

	function _getBondingCurvePriceMultiplier() internal view override returns(Decimal.D256 memory) {
		return Decimal.ratio(_shift(totalPurchased).sqrt(), _shift(scale).sqrt());
	}

	function _allocateSingle(uint amount, address pcvDeposit) internal override {
		IPCVDeposit(pcvDeposit).deposit{value : amount}(amount);
	}

	function _shift(uint x) internal view returns(uint) {
		return SHIFT + x;
	}
}

