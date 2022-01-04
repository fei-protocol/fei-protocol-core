// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./PegStabilityModule.sol";
import "./../utils/PauserV2.sol";

/// @notice ETH PSM that allows separate pausing of mint and redeem
/// by the guardian and governor
contract EthPegStabilityModule is PegStabilityModule, PauserV2 {

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
    ) PauserV2() {}

    /// @notice override redeem function that allows secondary pausing 
    function redeem(
        address to,
        uint256 amountFeiIn,
        uint256 minAmountOut
    ) external override nonReentrant whenNotSecondaryPaused returns (uint256 amountOut) {
        amountOut = _redeem(to, amountFeiIn, minAmountOut);
    }

    /// @notice set secondary pausable methods to paused
    function secondaryPause() public onlyGuardianOrGovernor {
        _secondaryPause();
    }

    /// @notice set secondary pausable methods to unpaused
    function secondaryUnpause() public onlyGuardianOrGovernor {
        _secondaryUnpause();
    }
}
