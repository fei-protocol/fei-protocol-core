pragma solidity ^0.6.0;

import "../token/UniswapIncentive.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IncentiveOrchestrator is Ownable {

	UniswapIncentive public uniswapIncentive;

	bool public deployed;

	function init(
		address core,
		address bondingCurveOracle, 
		address pair, 
		address router
	) public onlyOwner {
		if (!deployed) {
			uniswapIncentive = new UniswapIncentive(core, bondingCurveOracle, pair, router);
			deployed = true;	
		}
	}
}