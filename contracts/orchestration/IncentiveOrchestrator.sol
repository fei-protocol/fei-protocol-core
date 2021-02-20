pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../token/UniswapIncentive.sol";
import "./IOrchestrator.sol";

contract IncentiveOrchestrator is IIncentiveOrchestrator, Ownable {

	UniswapIncentive public uniswapIncentive;


	function init(
		address core,
		address bondingCurveOracle, 
		address pair, 
		address router,
		uint32 growthRate
	) public override onlyOwner returns(address) {
		return address(new UniswapIncentive(core, bondingCurveOracle, pair, router, growthRate));
	}

	function detonate() public override onlyOwner {
		selfdestruct(payable(owner()));
	}
}