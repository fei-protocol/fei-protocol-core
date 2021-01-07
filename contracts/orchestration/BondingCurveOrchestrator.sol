pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../pcv/EthUniswapPCVDeposit.sol";
import "../oracle/BondingCurveOracle.sol";
import "../bondingcurve/EthBondingCurve.sol";

contract BondingCurveOrchestrator is Ownable {

	function init(
		address core, 
		address uniswapOracle, 
		address pair, 
		address router, 
		uint scale,
		uint32 thawingDuration,
		uint32 bondingCurveIncentiveDuration,
		uint bondingCurveIncentiveAmount
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
		ethBondingCurve = address(new EthBondingCurve(
			scale, 
			core, 
			allocations, 
			ratios, 
			uniswapOracle, 
			bondingCurveIncentiveDuration, 
			bondingCurveIncentiveAmount
		));
		bondingCurveOracle = address(new BondingCurveOracle(
			core, 
			uniswapOracle, 
			ethBondingCurve, 
			thawingDuration
		));
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