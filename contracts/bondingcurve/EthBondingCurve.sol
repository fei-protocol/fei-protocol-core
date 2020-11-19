pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./BondingCurve.sol";
import "./IAllocation.sol";

contract EthBondingCurve is BondingCurve {

	constructor(uint256 scale, address core, address[] memory allocations, uint16[] memory ratios)
	BondingCurve(scale, core, allocations, ratios)
	public {}

	function purchase(uint256 amountIn, address to) public override payable returns (uint256 amountOut) {
		require(msg.value == amountIn, "Bonding Curve: Sent value does not equal input");
	 	amountOut = getAmountOut(amountIn);
	 	incrementTotalPurchased(amountOut);
		fii().mint(to, amountOut);
		allocate(amountIn);
		return amountOut;
	}

	// function purchaseFii() public payable {
	// 	(Decimal.D256 memory price, bool valid) = oracle().capture();
	// 	uint256 amount = price.mul(msg.value).asUint256();
	// 	FII.mint(msg.sender, amount);
	// }

	function getAmountOut(uint256 amountIn) public override view returns (uint256 amountOut) {
		uint256 radicand = (2 * amountIn * scale()) /* TODO div by oracle here */ + (totalPurchased() * totalPurchased());
		return sqrt(radicand) - totalPurchased();
	}

	function allocateSingle(uint256 amount, address allocation) internal override {
		IAllocation(allocation).deposit{value : amount}(amount);
	}

}

