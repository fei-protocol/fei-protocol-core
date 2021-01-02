pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../pcv/EthUniswapPCVController.sol";

contract ControllerOrchestrator is Ownable {

	function init(
		address core,
		address bondingCurveOracle, 
		address uniswapIncentive, 
		address ethUniswapPCVDeposit,
		address pair, 
		address router,
		uint reweightIncentive,
		uint reweightMinDistanceBPs
	) public onlyOwner returns(address) {
		return address(new EthUniswapPCVController(
				core, 
				ethUniswapPCVDeposit, 
				bondingCurveOracle, 
				uniswapIncentive,
				reweightIncentive,
				reweightMinDistanceBPs,
				pair, 
				router
			));
	}

	function detonate() public onlyOwner {
		selfdestruct(payable(owner()));
	}
}