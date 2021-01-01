pragma solidity ^0.6.0;

import "../pcv/EthUniswapPCVDeposit.sol";
import "../bondingcurve/EthBondingCurve.sol";
import "../oracle/BondingCurveOracle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BondingCurveOrchestrator is Ownable {
	uint public scale = 250_000_000e18;
	// uint public scale = 250_000_000; // TEST MODE

	uint32 public thawingDuration = 4 weeks;

	function init(
		address core, 
		address uniswapOracle, 
		address pair, 
		address router
	) public onlyOwner returns(
		address ethUniswapPCVDeposit,
		address ethBondingCurve,
		address bondingCurveOracle
	) {
		ethUniswapPCVDeposit = address(new EthUniswapPCVDeposit(core, pair, router, uniswapOracle));
		uint[] memory ratios = new uint[](1);
		ratios[0] = 10000;
		address[] memory allocations = new address[](1);
		allocations[0] = address(ethUniswapPCVDeposit);
		ethBondingCurve = address(new EthBondingCurve(scale, core, allocations, ratios, uniswapOracle));
		bondingCurveOracle = address(new BondingCurveOracle(core, uniswapOracle, address(ethBondingCurve), thawingDuration));
		return (
			ethUniswapPCVDeposit,
			ethBondingCurve,
			bondingCurveOracle
		);
	}

	function detonate() public onlyOwner {
		selfdestruct(payable(owner()));
	}
}