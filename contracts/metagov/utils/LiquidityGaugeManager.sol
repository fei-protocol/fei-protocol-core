// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../../refs/CoreRef.sol";
import "../../core/TribeRoles.sol";
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

    /// @notice address of the gauge controller used for voting
    address public gaugeController;

    /// @notice mapping of token staked to gauge address
    mapping(address=>address) public tokenToGauge;

    constructor(address _gaugeController) {
        gaugeController = _gaugeController;
    }

    /// @notice Set the gauge controller used for gauge weight voting
    /// @param _gaugeController the gauge controller address
    function setGaugeController(address _gaugeController) public onlyTribeRole(TribeRoles.METAGOVERNANCE_GAUGE_ADMIN) {
        gaugeController = _gaugeController;
    }

    /// @notice Set gauge for a given token.
    /// @param token the token address to stake in gauge
    /// @param gaugeAddress the address of the gauge where to stake token
    function setTokenToGauge(
        address token,
        address gaugeAddress
    ) public onlyTribeRole(TribeRoles.METAGOVERNANCE_GAUGE_ADMIN) {
        tokenToGauge[token] = gaugeAddress;
    }

    /// @notice Vote for a gauge's weight
    /// @param token the address of the token to vote for
    /// @param gaugeWeight the weight of gaugeAddress in basis points [0, 10_000]
    function voteForGaugeWeight(
        address token,
        uint256 gaugeWeight
    ) public whenNotPaused onlyTribeRole(TribeRoles.METAGOVERNANCE_VOTE_ADMIN) {
        address gaugeAddress = tokenToGauge[token];
        require(gaugeAddress != address(0), "LiquidityGaugeManager: token has no gauge configured");
        ILiquidityGaugeController(gaugeController).vote_for_gauge_weights(gaugeAddress, gaugeWeight);
    }

    /// @notice Stake tokens in a gauge
    /// @param token the address of the token to stake in the gauge
    /// @param amount the amount of tokens to stake in the gauge
    function stakeInGauge(
        address token,
        uint256 amount
    ) public whenNotPaused onlyTribeRole(TribeRoles.METAGOVERNANCE_GAUGE_STAKING) {
        address gaugeAddress = tokenToGauge[token];
        require(gaugeAddress != address(0), "LiquidityGaugeManager: token has no gauge configured");
        IERC20(token).approve(gaugeAddress, amount);
        ILiquidityGauge(gaugeAddress).deposit(amount);
    }

    /// @notice Stake all tokens held in a gauge
    /// @param token the address of the token to stake in the gauge
    function stakeAllInGauge(address token) public whenNotPaused onlyTribeRole(TribeRoles.METAGOVERNANCE_GAUGE_STAKING) {
        address gaugeAddress = tokenToGauge[token];
        require(gaugeAddress != address(0), "LiquidityGaugeManager: token has no gauge configured");
        uint256 amount = IERC20(token).balanceOf(address(this));
        IERC20(token).approve(gaugeAddress, amount);
        ILiquidityGauge(gaugeAddress).deposit(amount);
    }

    /// @notice Unstake tokens from a gauge
    /// @param token the address of the token to unstake from the gauge
    /// @param amount the amount of tokens to unstake from the gauge
    function unstakeFromGauge(
        address token,
        uint256 amount
    ) public whenNotPaused onlyTribeRole(TribeRoles.METAGOVERNANCE_GAUGE_STAKING) {
        address gaugeAddress = tokenToGauge[token];
        require(gaugeAddress != address(0), "LiquidityGaugeManager: token has no gauge configured");
        ILiquidityGauge(gaugeAddress).withdraw(amount, false);
    }

    /// @notice Claim rewards associated to a gauge where this contract stakes
    /// tokens.
    function claimGaugeRewards(address gaugeAddress) public whenNotPaused {
        ILiquidityGauge(gaugeAddress).claim_rewards();
    }
}
