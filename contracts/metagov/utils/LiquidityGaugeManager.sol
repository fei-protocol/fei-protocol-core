// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../../refs/CoreRef.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ILiquidityGauge {
    function deposit(uint256 value) external;
    function withdraw(uint256 value, bool claim_rewards) external;
    function claim_rewards() external;
    function balanceOf(address) external view returns(uint256);
}
interface ILiquidityGaugeController {
    function vote_for_gauge_weights(address gauge_addr, uint256 user_weight) external;
    function last_user_vote(address user, address gauge) external view returns(uint256);
    function vote_user_power(address user) external view returns(uint256);
}

/// @title Liquidity gauge manager, used to stake tokens in liquidity gauges.
/// @author Fei Protocol
abstract contract LiquidityGaugeManager is CoreRef {

    /// @notice Vote for a gauge's weight
    /// @param gaugeController the address of a gauge controller contract
    /// @param gaugeAddress the address of a gauge controlled by the gaugeController
    /// @param gaugeWeight the weight of gaugeAddress in basis points [0, 10_000]
    function voteForGaugeWeight(
        address gaugeController,
        address gaugeAddress,
        uint256 gaugeWeight
    ) public whenNotPaused onlyGovernorOrAdmin {
        ILiquidityGaugeController(gaugeController).vote_for_gauge_weights(gaugeAddress, gaugeWeight);
    }

    /// @notice Stake tokens in a gauge
    /// @param gaugeAddress the address of a gauge to stake tokens in
    /// @param token the address of the token to stake in the gauge
    /// @param amount the amount of tokens to stake in the gauge
    function stakeInGauge(
        address gaugeAddress,
        address token,
        uint256 amount
    ) public whenNotPaused onlyPCVController {
        IERC20(token).approve(gaugeAddress, amount);
        ILiquidityGauge(gaugeAddress).deposit(amount);
    }

    /// @notice Stake all tokens held in a gauge
    /// @param gaugeAddress the address of a gauge to stake tokens in
    /// @param token the address of the token to stake in the gauge
    function stakeAllInGauge(
        address gaugeAddress,
        address token
    ) public whenNotPaused onlyPCVController {
        uint256 amount = IERC20(token).balanceOf(address(this));
        stakeInGauge(gaugeAddress, token, amount);
    }

    /// @notice Unstake tokens from a gauge
    /// @param gaugeAddress the address of a gauge to unstake tokens from
    /// @param token the address of the token to unstake from the gauge
    /// @param amount the amount of tokens to unstake from the gauge
    function unstakeFromGauge(
        address gaugeAddress,
        address token,
        uint256 amount
    ) public whenNotPaused onlyPCVController {
        ILiquidityGauge(gaugeAddress).withdraw(amount, false);
    }

    /// @notice Claim rewards associated to a gauge where this contract stakes
    /// tokens.
    function claimGaugeRewards(address gaugeAddress) public whenNotPaused {
        ILiquidityGauge(gaugeAddress).claim_rewards();
    }
}
