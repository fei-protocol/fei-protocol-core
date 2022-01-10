// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./PegStabilityModule.sol";

/// @notice ETH PSM that allows separate pausing of mint and redeem
/// by the guardian and governor
contract EthPegStabilityModule is PegStabilityModule {

    /// @notice boolean switch that indicates whether redemptions are paused
    bool public redeemPaused;

    /// @notice event that is emitted when redemptions are paused
    event RedemptionsPaused(address account);
    
    /// @notice event that is emitted when redemptions are unpaused
    event RedemptionsUnpaused(address account);

    constructor(
        OracleParams memory params,
        uint256 _mintFeeBasisPoints,
        uint256 _redeemFeeBasisPoints,
        uint256 _reservesThreshold,
        uint256 _feiLimitPerSecond,
        uint256 _mintingBufferCap,
        IERC20 _underlyingToken,
        IPCVDeposit _surplusTarget
    ) PegStabilityModule(
        params,
        _mintFeeBasisPoints,
        _redeemFeeBasisPoints,
        _reservesThreshold,
        _feiLimitPerSecond,
        _mintingBufferCap,
        _underlyingToken,
        _surplusTarget
    ) {}

    /// @notice modifier that allows execution when redemptions are not paused
    modifier whileRedemptionsNotPaused {
        require(!redeemPaused, "EthPSM: Redeem paused");
        _;
    }

    /// @notice modifier that allows execution when redemptions are paused
    modifier whileRedemptionsPaused {
        require(redeemPaused, "EthPSM: Redeem not paused");
        _;
    }

    /// @notice set secondary pausable methods to paused
    function pauseRedeem() public isGovernorOrGuardianOrAdmin whileRedemptionsNotPaused {
        redeemPaused = true;
        emit RedemptionsPaused(msg.sender);
    }

    /// @notice set secondary pausable methods to unpaused
    function unpauseRedeem() public isGovernorOrGuardianOrAdmin whileRedemptionsPaused {
        redeemPaused = false;
        emit RedemptionsUnpaused(msg.sender);
    }

    /// @notice override redeem function that allows secondary pausing 
    function redeem(
        address to,
        uint256 amountFeiIn,
        uint256 minAmountOut
    ) external override nonReentrant whileRedemptionsNotPaused returns (uint256 amountOut) {
        amountOut = _redeem(to, amountFeiIn, minAmountOut);
    }
}
