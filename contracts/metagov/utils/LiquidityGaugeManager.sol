// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../../refs/CoreRef.sol";
import "../../core/TribeRoles.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ILiquidityGauge {
    function deposit(uint256 value) external;

    function withdraw(uint256 value, bool claim_rewards) external;

    function claim_rewards() external;

    function balanceOf(address) external view returns (uint256);

    // curve & balancer use lp_token()
    function lp_token() external view returns (address);

    // angle use staking_token()
    function staking_token() external view returns (address);

    function reward_tokens(uint256 i) external view returns (address token);

    function reward_count() external view returns (uint256 nTokens);
}

interface ILiquidityGaugeController {
    function vote_for_gauge_weights(address gauge_addr, uint256 user_weight) external;

    function last_user_vote(address user, address gauge) external view returns (uint256);

    function vote_user_power(address user) external view returns (uint256);

    function gauge_types(address gauge) external view returns (int128);

    function vote_user_slopes(address user, address gauge)
        external
        view
        returns (
            uint256 slope,
            uint256 power,
            uint256 end
        );
}

/// @title Liquidity gauge manager, used to stake tokens in liquidity gauges.
/// @author Fei Protocol
abstract contract LiquidityGaugeManager is CoreRef {
    // Events
    event GaugeControllerChanged(address indexed oldController, address indexed newController);
    event GaugeSetForToken(address indexed token, address indexed gauge);
    event GaugeVote(address indexed gauge, uint256 amount);
    event GaugeStake(address indexed gauge, uint256 amount);
    event GaugeUnstake(address indexed gauge, uint256 amount);
    event GaugeRewardsClaimed(address indexed gauge, address indexed token, uint256 amount);

    /// @notice address of the gauge controller used for voting
    address public gaugeController;

    /// @notice mapping of token staked to gauge address
    mapping(address => address) public tokenToGauge;

    constructor(address _gaugeController) {
        gaugeController = _gaugeController;
    }

    /// @notice Set the gauge controller used for gauge weight voting
    /// @param _gaugeController the gauge controller address
    function setGaugeController(address _gaugeController) public onlyTribeRole(TribeRoles.METAGOVERNANCE_GAUGE_ADMIN) {
        require(gaugeController != _gaugeController, "LiquidityGaugeManager: same controller");

        address oldController = gaugeController;
        gaugeController = _gaugeController;

        emit GaugeControllerChanged(oldController, gaugeController);
    }

    /// @notice returns the token address to be staked in the given gauge
    function _tokenStakedInGauge(address gaugeAddress) internal view virtual returns (address) {
        return ILiquidityGauge(gaugeAddress).lp_token();
    }

    /// @notice Set gauge for a given token.
    /// @param token the token address to stake in gauge
    /// @param gaugeAddress the address of the gauge where to stake token
    function setTokenToGauge(address token, address gaugeAddress)
        public
        onlyTribeRole(TribeRoles.METAGOVERNANCE_GAUGE_ADMIN)
    {
        require(_tokenStakedInGauge(gaugeAddress) == token, "LiquidityGaugeManager: wrong gauge for token");
        require(
            ILiquidityGaugeController(gaugeController).gauge_types(gaugeAddress) >= 0,
            "LiquidityGaugeManager: wrong gauge address"
        );
        tokenToGauge[token] = gaugeAddress;

        emit GaugeSetForToken(token, gaugeAddress);
    }

    /// @notice Vote for a gauge's weight
    /// @param token the address of the token to vote for
    /// @param gaugeWeight the weight of gaugeAddress in basis points [0, 10_000]
    function voteForGaugeWeight(address token, uint256 gaugeWeight)
        public
        whenNotPaused
        onlyTribeRole(TribeRoles.METAGOVERNANCE_VOTE_ADMIN)
    {
        address gaugeAddress = tokenToGauge[token];
        require(gaugeAddress != address(0), "LiquidityGaugeManager: token has no gauge configured");
        ILiquidityGaugeController(gaugeController).vote_for_gauge_weights(gaugeAddress, gaugeWeight);

        emit GaugeVote(gaugeAddress, gaugeWeight);
    }

    /// @notice Stake tokens in a gauge
    /// @param token the address of the token to stake in the gauge
    /// @param amount the amount of tokens to stake in the gauge
    function stakeInGauge(address token, uint256 amount)
        public
        whenNotPaused
        onlyTribeRole(TribeRoles.METAGOVERNANCE_GAUGE_ADMIN)
    {
        address gaugeAddress = tokenToGauge[token];
        require(gaugeAddress != address(0), "LiquidityGaugeManager: token has no gauge configured");
        IERC20(token).approve(gaugeAddress, amount);
        ILiquidityGauge(gaugeAddress).deposit(amount);

        emit GaugeStake(gaugeAddress, amount);
    }

    /// @notice Stake all tokens held in a gauge
    /// @param token the address of the token to stake in the gauge
    function stakeAllInGauge(address token) public whenNotPaused onlyTribeRole(TribeRoles.METAGOVERNANCE_GAUGE_ADMIN) {
        address gaugeAddress = tokenToGauge[token];
        require(gaugeAddress != address(0), "LiquidityGaugeManager: token has no gauge configured");
        uint256 amount = IERC20(token).balanceOf(address(this));
        IERC20(token).approve(gaugeAddress, amount);
        ILiquidityGauge(gaugeAddress).deposit(amount);

        emit GaugeStake(gaugeAddress, amount);
    }

    /// @notice Unstake tokens from a gauge
    /// @param token the address of the token to unstake from the gauge
    /// @param amount the amount of tokens to unstake from the gauge
    function unstakeFromGauge(address token, uint256 amount)
        public
        whenNotPaused
        onlyTribeRole(TribeRoles.METAGOVERNANCE_GAUGE_ADMIN)
    {
        address gaugeAddress = tokenToGauge[token];
        require(gaugeAddress != address(0), "LiquidityGaugeManager: token has no gauge configured");
        ILiquidityGauge(gaugeAddress).withdraw(amount, false);

        emit GaugeUnstake(gaugeAddress, amount);
    }

    /// @notice Claim rewards associated to a gauge where this contract stakes
    /// tokens.
    function claimGaugeRewards(address token) public whenNotPaused {
        address gaugeAddress = tokenToGauge[token];
        require(gaugeAddress != address(0), "LiquidityGaugeManager: token has no gauge configured");

        uint256 nTokens = ILiquidityGauge(gaugeAddress).reward_count();
        address[] memory tokens = new address[](nTokens);
        uint256[] memory amounts = new uint256[](nTokens);

        for (uint256 i = 0; i < nTokens; i++) {
            tokens[i] = ILiquidityGauge(gaugeAddress).reward_tokens(i);
            amounts[i] = IERC20(tokens[i]).balanceOf(address(this));
        }

        ILiquidityGauge(gaugeAddress).claim_rewards();

        for (uint256 i = 0; i < nTokens; i++) {
            amounts[i] = IERC20(tokens[i]).balanceOf(address(this)) - amounts[i];

            emit GaugeRewardsClaimed(gaugeAddress, tokens[i], amounts[i]);
        }
    }
}
