pragma solidity ^0.6.0;

/// @title A Uniswap Router for token/ETH swaps
/// @author Fei Protocol
interface IUniswapSingleEthRouter {

    // ----------- state changing api -----------

    /// @notice swap ETH for tokens with some protections
    /// @param amountOutMin minimum tokens received
    /// @param to address to send tokens
    /// @param deadline block timestamp after which trade is invalid
    /// @return amountOut the amount of tokens received
    function swapExactETHForTokens(
        uint amountOutMin, 
        address to, 
        uint deadline
    ) external payable returns(uint amountOut);

    /// @notice swap tokens for ETH with some protections
    /// @param amountIn amount of tokens to sell
    /// @param amountOutMin minimum ETH received
    /// @param to address to send ETH
    /// @param deadline block timestamp after which trade is invalid
    /// @return amountOut the amount of ETH received
    function swapExactTokensForETH(
        uint amountIn, 
        uint amountOutMin, 
        address to, 
        uint deadline
    ) external returns (uint amountOut);
}