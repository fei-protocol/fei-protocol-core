pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./UniswapSingleEthRouter.sol";
import "../refs/IOracleRef.sol";
import "../core/ICore.sol";
import "./IFeiRouter.sol";

/// @title A Uniswap Router for FEI/ETH swaps
/// @author Fei Protocol
contract FeiRouter is UniswapSingleEthRouter, IFeiRouter {

    // solhint-disable-next-line var-name-mixedcase
    ICore public immutable CORE;

    constructor(
        address pair,
        address weth,
        address core
    ) public UniswapSingleEthRouter(pair, weth) {
        CORE = ICore(core);
    }

    /// @notice buy FEI for ETH with some protections
    /// @param minReward minimum mint reward for purchasing
    /// @param amountOutMin minimum FEI received
    /// @param to address to send FEI
    /// @param deadline block timestamp after which trade is invalid
    function buyFei(
        uint256 minReward,
        uint256 amountOutMin,
        address to,
        uint256 deadline
    ) external payable override returns (uint256 amountOut) {
        IUniswapIncentive incentive = incentiveContract();
        IOracleRef(address(incentive)).updateOracle();

        uint256 reward = 0;
        if (!incentive.isExemptAddress(to)) {
            (reward, , , ) = incentive.getBuyIncentive(amountOutMin);
        }
        require(reward >= minReward, "FeiRouter: Not enough reward");
        return swapExactETHForTokens(amountOutMin, to, deadline);
    }

    /// @notice sell FEI for ETH with some protections
    /// @param maxPenalty maximum fei burn for purchasing
    /// @param amountIn amount of FEI to sell
    /// @param amountOutMin minimum ETH received
    /// @param to address to send ETH
    /// @param deadline block timestamp after which trade is invalid
    function sellFei(
        uint256 maxPenalty,
        uint256 amountIn,
        uint256 amountOutMin,
        address to,
        uint256 deadline
    ) external override returns (uint256 amountOut) {
        IUniswapIncentive incentive = incentiveContract();
        IOracleRef(address(incentive)).updateOracle();

        uint256 penalty = 0;
        if (!incentive.isExemptAddress(msg.sender)) {
            (penalty, , ) = incentive.getSellPenalty(amountIn);
        }
        require(penalty <= maxPenalty, "FeiRouter: Penalty too high");
        return swapExactTokensForETH(amountIn, amountOutMin, to, deadline);
    }

    function incentiveContract() public view override returns(IUniswapIncentive) {
        return IUniswapIncentive(CORE.fei().incentiveContract(address(PAIR)));
    }
}
