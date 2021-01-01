pragma solidity ^0.6.0;

import "../token/UniswapIncentive.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IncentiveOrchestrator is Ownable {

	UniswapIncentive public uniswapIncentive;

	uint32 public constant DEFAULT_INCENTIVE_GROWTH_RATE = 333; // about 1 unit per hour assuming 12s block time

	function init(
		address core,
		address bondingCurveOracle, 
		address pair, 
		address router
	) public onlyOwner returns(address) {
		return address(new UniswapIncentive(core, bondingCurveOracle, pair, router, DEFAULT_INCENTIVE_GROWTH_RATE));
	}

	function detonate() public onlyOwner {
		selfdestruct(payable(owner()));
	}
}