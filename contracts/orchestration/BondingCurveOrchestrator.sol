pragma solidity ^0.6.0;

import "../pcv/EthUniswapPCVDeposit.sol";
import "../bondingcurve/EthBondingCurve.sol";
import "../oracle/BondingCurveOracle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BondingCurveOrchestrator is Ownable {
	EthUniswapPCVDeposit public ethUniswapPCVDeposit;
	uint public scale = 250_000_000e18;
	EthBondingCurve public ethBondingCurve;
	BondingCurveOracle public bondingCurveOracle;
	bool public deployed;

	function init(address core, address uniswapOracle, address pair, address router) public onlyOwner {
		if (!deployed) {
			ethUniswapPCVDeposit = new EthUniswapPCVDeposit(core, pair, router, uniswapOracle);
			uint256[] memory ratios = new uint256[](1);
			ratios[0] = 10000;
			address[] memory allocations = new address[](1);
			allocations[0] = address(ethUniswapPCVDeposit);
			ethBondingCurve = new EthBondingCurve(scale, core, allocations, ratios, uniswapOracle);
			bondingCurveOracle = new BondingCurveOracle(core, uniswapOracle, address(ethBondingCurve));
			deployed = true;
		}
	}
}