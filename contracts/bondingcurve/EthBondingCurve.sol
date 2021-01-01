pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./BondingCurve.sol";
import "../pcv/IPCVDeposit.sol";

/// @title a square root growth bonding curve for purchasing FEI with ETH
/// @author Fei Protocol
contract EthBondingCurve is BondingCurve {

	constructor(
		uint256 scale, 
		address core, 
		address[] memory pcvDeposits, 
		uint256[] memory ratios, 
		address oracle
	) public
		BondingCurve(scale, core, pcvDeposits, ratios, oracle) {}

	function purchase(address to, uint256 amountIn) external override payable postGenesis returns (uint256 amountOut) {
		require(msg.value == amountIn, "Bonding Curve: Sent value does not equal input");
		return _purchase(amountIn, to);
	}

	// Represents the integral solved for upper bound of P(x) = (X/S)^1/2 * O
	function _getBondingCurveAmountOut(uint256 adjustedAmountIn) internal view override returns (uint256 amountOut) {
		uint256 radicand = (3 * adjustedAmountIn * scale.sqrt() / 2) + totalPurchased.threeHalfsRoot();
		return radicand.twoThirdsRoot() - totalPurchased;
	}

	function _getBondingCurvePriceMultiplier() internal view override returns(Decimal.D256 memory) {
		return Decimal.ratio(totalPurchased.sqrt(), scale.sqrt());
	}

	function _allocateSingle(uint256 amount, address pcvDeposit) internal override {
		IPCVDeposit(pcvDeposit).deposit{value : amount}(amount);
	}

}

