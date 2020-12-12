pragma solidity ^0.6.0;

import "../pcv/EthUniswapPCVDeposit.sol";
import "../bondingcurve/EthBondingCurve.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BondingCurveOrchestrator is Ownable {
	address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
	EthUniswapPCVDeposit public ethUniswapPCVDeposit;
	uint public scale = 250_000_000e18;
	EthBondingCurve public ethBondingCurve;
	bool public deployed;

	function init(address core, address uniswapOracle) public onlyOwner {
		if (!deployed) {
			ethUniswapPCVDeposit = new EthUniswapPCVDeposit(WETH, core);
			uint16[] memory ratios = new uint16[](1);
			ratios[0] = 10000;
			address[] memory allocations = new address[](1);
			allocations[0] = address(ethUniswapPCVDeposit);
			ethBondingCurve = new EthBondingCurve(scale, core, allocations, ratios, uniswapOracle);
			deployed = true;
		}
	}
}