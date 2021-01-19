pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./UniswapSingleEthRouter.sol";
import "../refs/IOracleRef.sol";
import "../token/IUniswapIncentive.sol";

contract FeiRouter is UniswapSingleEthRouter {

	IUniswapIncentive public immutable INCENTIVE;
	constructor(
		address pair, 
		address weth,
		address incentive
	) public UniswapSingleEthRouter(pair, weth) {
		INCENTIVE = IUniswapIncentive(incentive);
	}

	function buyFei(
		uint minReward, 
		uint amountOutMin, 
		address to, 
		uint deadline
	) external payable {
		IOracleRef(address(INCENTIVE)).updateOracle();

		uint reward = 0;
		if (!INCENTIVE.isExemptAddress(to)) {
			(reward,,,) = INCENTIVE.getBuyIncentive(amountOutMin);
		}
		require(reward >= minReward, "FeiRouter: Not enough reward");
		swapExactETHForTokens(amountOutMin, to, deadline);
	}

	function sellFei(
		uint maxPenalty, 
		uint amountIn, 
		uint amountOutMin, 
		address to, 
		uint deadline
	) external {
		IOracleRef(address(INCENTIVE)).updateOracle();

		uint penalty = 0;
		if (!INCENTIVE.isExemptAddress(to)) {
			(penalty,,) = INCENTIVE.getSellPenalty(amountIn);
		}
		require(penalty <= maxPenalty, "FeiRouter: Penalty too high");
		swapExactTokensForETH(amountIn, amountOutMin, to, deadline);
	}
}