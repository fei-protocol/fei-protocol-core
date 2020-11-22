pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./BondingCurve.sol";
import "../allocation/IAllocation.sol";

contract EthBondingCurve is BondingCurve {

	constructor(uint256 scale, address core, address[] memory allocations, uint16[] memory ratios, address oracle)
	BondingCurve(scale, core, allocations, ratios, oracle)
	public {}

	function purchase(uint256 amountIn, address to) public override payable returns (uint256 amountOut) {
		require(msg.value == amountIn, "Bonding Curve: Sent value does not equal input");
		return _purchase(amountIn, to);
	}

	function getBondingCurveAmountOut(uint256 amountIn) public override view returns (uint256 amountOut) {
		uint256 radicand = (2 * amountIn * scale()) + (totalPurchased() * totalPurchased());
		return sqrt(radicand) - totalPurchased();
	}

	function allocateSingle(uint256 amount, address allocation) internal override {
		IAllocation(allocation).deposit{value : amount}(amount);
	}

}

