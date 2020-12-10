pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "../external/Decimal.sol";

interface IMockUniswapV2PairLiquidity is IUniswapV2Pair {
	function burnEth(address to, Decimal.D256 calldata ratio) external returns(uint256 amountEth, uint256 amount1);
	function mintAmount(address to, uint256 _liquidity) external payable; 
	function setReserves(uint112 newReserve0, uint112 newReserve1) external;
}