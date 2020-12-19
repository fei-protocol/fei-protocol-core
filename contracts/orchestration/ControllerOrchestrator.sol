pragma solidity ^0.6.0;

import "../pcv/EthUniswapPCVController.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ControllerOrchestrator is Ownable {

	EthUniswapPCVController public ethUniswapPCVController;

	uint public constant REWEIGHT_INCENTIVE = 100e18;
	uint public constant MIN_REWEIGHT_DISTANCE_BPS = 100;

	bool public deployed;

	function init(
		address core,
		address bondingCurveOracle, 
		address uniswapIncentive, 
		address ethUniswapPCVDeposit,
		address pair, 
		address router
	) public onlyOwner {
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