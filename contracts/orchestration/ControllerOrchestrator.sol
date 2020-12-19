pragma solidity ^0.6.0;

import "../pcv/EthUniswapPCVController.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";

contract ControllerOrchestrator is Ownable {

	EthUniswapPCVController public ethUniswapPCVController;

	address public constant WETH = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
	address public constant UNISWAP_FACTORY = address(0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f);

	uint public constant REWEIGHT_INCENTIVE = 100e18;
	uint public constant MIN_REWEIGHT_DISTANCE_BPS = 100;

	bool public deployed;

	function init(
		address core,
		address bondingCurveOracle, 
		address uniswapIncentive, 
		address ethUniswapPCVDeposit,
		address fei, 
		address router
	) public onlyOwner {
		address pair = UniswapV2Library.pairFor(UNISWAP_FACTORY, fei, WETH);

		if (!deployed) {
			ethUniswapPCVController = new EthUniswapPCVController(
				core, 
				ethUniswapPCVDeposit, 
				bondingCurveOracle, 
				uniswapIncentive,
				REWEIGHT_INCENTIVE,
				MIN_REWEIGHT_DISTANCE_BPS,
				pair, 
				router
			);
			deployed = true;	
		}
	}
}