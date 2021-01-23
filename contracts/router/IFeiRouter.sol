pragma solidity ^0.6.0;

/// @title A Uniswap Router for FEI/ETH swaps
/// @author Fei Protocol
interface IFeiRouter {

    // ----------- state changing api -----------

    /// @notice buy FEI for ETH with some protections
    /// @param minReward minimum mint reward for purchasing
    /// @param amountOutMin minimum FEI received
    /// @param to address to send FEI
    /// @param deadline block timestamp after which trade is invalid
    function buyFei(
        uint minReward, 
        uint amountOutMin, 
        address to, 
        uint deadline
    ) external payable returns(uint amountOut);

    /// @notice sell FEI for ETH with some protections
    /// @param maxPenalty maximum fei burn for purchasing
    /// @param amountIn amount of FEI to sell
    /// @param amountOutMin minimum ETH received
    /// @param to address to send ETH
    /// @param deadline block timestamp after which trade is invalid
    function sellFei(
        uint maxPenalty, 
        uint amountIn, 
        uint amountOutMin, 
        address to, 
        uint deadline
    ) external returns(uint amountOut);
}