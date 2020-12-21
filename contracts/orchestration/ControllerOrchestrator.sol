pragma solidity ^0.6.0;

import "../pcv/EthUniswapPCVController.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ControllerOrchestrator is Ownable {

	uint public constant REWEIGHT_INCENTIVE = 100e18;
	uint public constant MIN_REWEIGHT_DISTANCE_BPS = 100;

	function init(
		address core,
		address bondingCurveOracle, 
		address uniswapIncentive, 
		address ethUniswapPCVDeposit,
		address pair, 
		address router
	) public onlyOwner returns(address) {
		return address(new EthUniswapPCVController(
				core, 
				ethUniswapPCVDeposit, 
				bondingCurveOracle, 
				uniswapIncentive,
				REWEIGHT_INCENTIVE,
				MIN_REWEIGHT_DISTANCE_BPS,
				pair, 
				router
			));
	}

	function detonate() public onlyOwner {
		selfdestruct(payable(owner()));
	}
}