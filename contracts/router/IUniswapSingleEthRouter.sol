pragma solidity ^0.6.0;

/// @title UniswapSingleEthRouter interface
/// @author Fei Protocol
interface IUniswapSingleEthRouter {
    // ----------- state changing api -----------

    function swapExactETHForTokens(
        uint256 amountOutMin,
        address to,
        uint256 deadline
    ) external payable returns (uint256 amountOut);

    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountOut);
}
