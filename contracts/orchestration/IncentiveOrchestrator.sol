pragma solidity ^0.6.0;

import "../token/UniswapIncentive.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IncentiveOrchestrator is Ownable {

	UniswapIncentive public uniswapIncentive;

	function init(
		address core,
		address bondingCurveOracle, 
		address pair, 
		address router
	) public onlyOwner returns(address) {
		return address(new UniswapIncentive(core, bondingCurveOracle, pair, router));
	}

	function detonate() public onlyOwner {
		selfdestruct(payable(owner()));
	}
}