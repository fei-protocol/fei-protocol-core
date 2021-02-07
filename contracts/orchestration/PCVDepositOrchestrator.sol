pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../pcv/EthUniswapPCVDeposit.sol";
import "../oracle/UniswapOracle.sol";
import "./IOrchestrator.sol";

contract PCVDepositOrchestrator is IPCVDepositOrchestrator, Ownable {

	function init(
		address core, 
		address pair, 
		address router,
		address oraclePair,
		uint twapDuration,
		bool isPrice0
	) public override onlyOwner returns(
		address ethUniswapPCVDeposit,
		address uniswapOracle
	) {
		uniswapOracle = address(new UniswapOracle(core, 
			oraclePair, 
			twapDuration, 
			isPrice0
		));
		ethUniswapPCVDeposit = address(new EthUniswapPCVDeposit(core, pair, router, uniswapOracle));

		return (
			ethUniswapPCVDeposit,
			uniswapOracle
		);
	}

	function detonate() public override onlyOwner {
		selfdestruct(payable(owner()));
	}
}