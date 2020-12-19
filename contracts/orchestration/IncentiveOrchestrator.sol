pragma solidity ^0.6.0;

import "../oracle/BondingCurveOracle.sol";
import "../pcv/EthUniswapPCVController.sol";
import "../token/UniswapIncentive.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";

contract IncentiveOrchestrator is Ownable {

	UniswapIncentive public uniswapIncentive;
	BondingCurveOracle public bondingCurveOracle;
	EthUniswapPCVController public ethUniswapPCVController;

	address public constant WETH = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
	address public constant UNISWAP_FACTORY = address(0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f);

	uint public constant REWEIGHT_INCENTIVE = 100e18;
	uint public constant MIN_REWEIGHT_DISTANCE_BPS = 100;

	bool public deployed;

	function init(
		address core,
		address uniswapOracle, 
		address ethBondingCurve, 
		address ethUniswapPCVDeposit,
		address fei, 
		address router
	) public onlyOwner {
		address pair = UniswapV2Library.pairFor(UNISWAP_FACTORY, fei, WETH);

		if (!deployed) {
			bondingCurveOracle = new BondingCurveOracle(core, uniswapOracle, ethBondingCurve);
			uniswapIncentive = new UniswapIncentive(core, address(bondingCurveOracle), pair, router);
			ethUniswapPCVController = new EthUniswapPCVController(
				core, 
				ethUniswapPCVDeposit, 
				address(bondingCurveOracle), 
				address(uniswapIncentive),
				REWEIGHT_INCENTIVE,
				MIN_REWEIGHT_DISTANCE_BPS,
				pair, 
				router
			);
			deployed = true;	
		}
	}
}