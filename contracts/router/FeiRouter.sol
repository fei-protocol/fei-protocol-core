pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./UniswapSingleEthRouter.sol";
import "../refs/IOracleRef.sol";
import "../token/IUniswapIncentive.sol";
import "./IFeiRouter.sol";

contract FeiRouter is UniswapSingleEthRouter, IFeiRouter {

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
	) external payable override returns(uint amountOut) {
		IOracleRef(address(INCENTIVE)).updateOracle();

		uint reward = 0;
		if (!INCENTIVE.isExemptAddress(to)) {
			(reward,,,) = INCENTIVE.getBuyIncentive(amountOutMin);
		}
		require(reward >= minReward, "FeiRouter: Not enough reward");
		return swapExactETHForTokens(amountOutMin, to, deadline);
	}

	function sellFei(
		uint maxPenalty, 
		uint amountIn, 
		uint amountOutMin, 
		address to, 
		uint deadline
	) external override returns(uint amountOut) {
		IOracleRef(address(INCENTIVE)).updateOracle();

		uint penalty = 0;
		if (!INCENTIVE.isExemptAddress(to)) {
			(penalty,,) = INCENTIVE.getSellPenalty(amountIn);
		}
		require(penalty <= maxPenalty, "FeiRouter: Penalty too high");
		return swapExactTokensForETH(amountIn, amountOutMin, to, deadline);
	}
}