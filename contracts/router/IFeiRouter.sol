pragma solidity ^0.6.0;

import "../token/IUniswapIncentive.sol";

/// @title FeiRouter interface
/// @author Fei Protocol
interface IFeiRouter {
    // ----------- state changing api -----------

    function buyFei(
        uint256 minReward,
        uint256 amountOutMin,
        address to,
        uint256 deadline
    ) external payable returns (uint256 amountOut);

    function sellFei(
        uint256 maxPenalty,
        uint256 amountIn,
        uint256 amountOutMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountOut);
}
