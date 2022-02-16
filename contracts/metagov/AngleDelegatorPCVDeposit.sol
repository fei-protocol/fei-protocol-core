// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./SnapshotDelegatorPCVDeposit.sol";
import "./utils/VoteEscrowTokenManager.sol";
import "./utils/LiquidityGaugeManager.sol";
import "./utils/OZGovernorVoter.sol";

/// @title ANGLE Token PCV Deposit
/// @author Fei Protocol
contract AngleDelegatorPCVDeposit is SnapshotDelegatorPCVDeposit, VoteEscrowTokenManager, LiquidityGaugeManager, OZGovernorVoter {

    address private constant ANGLE_TOKEN = 0x31429d1856aD1377A8A0079410B297e1a9e214c2;
    address private constant ANGLE_VE_TOKEN = 0x0C462Dbb9EC8cD1630f1728B2CFD2769d09f0dd5;
    address private constant ANGLE_GAUGE_MANAGER = 0x9aD7e7b0877582E14c17702EecF49018DD6f2367;
    bytes32 private constant ANGLE_SNAPSHOT_SPACE = keccak256("anglegovernance.eth");

    /// @notice ANGLE token manager
    /// @param _core Fei Core for reference
    /// @param _initialDelegate initial delegate for snapshot votes
    constructor(
        address _core,
        address _initialDelegate
    ) SnapshotDelegatorPCVDeposit(
        _core,
        IERC20(ANGLE_TOKEN), // token used in reporting
        ANGLE_SNAPSHOT_SPACE, // snapshot spaceId
        _initialDelegate
    ) VoteEscrowTokenManager(
        IERC20(ANGLE_TOKEN), // liquid token
        IVeToken(ANGLE_VE_TOKEN), // vote-escrowed token
        4 * 365 * 86400 // vote-escrow max time = 4 years
    ) LiquidityGaugeManager(ANGLE_GAUGE_MANAGER) OZGovernorVoter() {}

    /// @notice returns total balance of PCV in the Deposit
    function balance() public view override returns (uint256) {
        return _totalTokens(); // liquid and vote-escrowed tokens
    }
}
