pragma solidity ^0.6.0;

import "../oracle/BondingCurveOracle.sol";
import "../pcv/EthUniswapPCVController.sol";
import "../token/UniswapIncentive.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IncentiveOrchestrator is Ownable {

	UniswapIncentive public uniswapIncentive;
	BondingCurveOracle public bondingCurveOracle;
	EthUniswapPCVController public ethUniswapPCVController;

	uint public constant REWEIGHT_INCENTIVE = 100e18;
	uint public constant MIN_REWEIGHT_DISTANCE_BPS = 100;

	bool public deployed;

	function init(address core, address uniswapOracle, address ethBondingCurve, address ethUniswapPCVDeposit) public onlyOwner {
		if (!deployed) {
			bondingCurveOracle = new BondingCurveOracle(core, uniswapOracle, ethBondingCurve);
			uniswapIncentive = new UniswapIncentive(core, address(bondingCurveOracle));
			ethUniswapPCVController = new EthUniswapPCVController(
				core, 
				ethUniswapPCVDeposit, 
				address(bondingCurveOracle), 
				address(uniswapIncentive),
				REWEIGHT_INCENTIVE,
				MIN_REWEIGHT_DISTANCE_BPS
			);
			deployed = true;	
		}
	}
}