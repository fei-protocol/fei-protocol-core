pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../pcv/EthUniswapPCVDeposit.sol";
import "../oracle/UniswapOracle.sol";

contract PCVDepositOrchestrator is Ownable {

	function init(
		address core, 
		address pair, 
		address router,
		address oraclePair,
		uint32 twapDuration,
		bool price0
	) public onlyOwner returns(
		address ethUniswapPCVDeposit,
		address uniswapOracle
	) {
		uniswapOracle = address(new UniswapOracle(core, 
			oraclePair, 
			twapDuration, 
			price0
		));
		ethUniswapPCVDeposit = address(new EthUniswapPCVDeposit(core, pair, router, uniswapOracle));

		return (
			ethUniswapPCVDeposit,
			uniswapOracle
		);
	}

	function detonate() public onlyOwner {
		selfdestruct(payable(owner()));
	}
}