pragma solidity ^0.6.0;

import "../pcv/EthUniswapPCVDeposit.sol";
import "../bondingcurve/EthBondingCurve.sol";
import "../oracle/BondingCurveOracle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";

contract BondingCurveOrchestrator is Ownable {
	EthUniswapPCVDeposit public ethUniswapPCVDeposit;
	uint public scale = 250_000_000e18;
	EthBondingCurve public ethBondingCurve;
	BondingCurveOracle public bondingCurveOracle;
	bool public deployed;

	address public constant WETH = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
	address public constant UNISWAP_FACTORY = address(0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f);

	function init(address core, address uniswapOracle, address fei, address router) public onlyOwner {
		if (!deployed) {
			address pair = UniswapV2Library.pairFor(UNISWAP_FACTORY, fei, WETH);
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