pragma solidity ^0.6.2;

import "./IPCVDeposit.sol";
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';

interface IUniswapPCVDeposit is IPCVDeposit {
	function pair() external view returns(IUniswapV2Pair);
}
