// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./SnapshotDelegatorPCVDeposit.sol";
import "./utils/VoteEscrowTokenManager.sol";
import "./utils/LiquidityGaugeManager.sol";
import "./utils/OZGovernorVoter.sol";

/// @title ANGLE Token PCV Deposit
/// @author Fei Protocol
contract AngleDelegatorPCVDeposit is SnapshotDelegatorPCVDeposit, VoteEscrowTokenManager, LiquidityGaugeManager, OZGovernorVoter {

    /// @notice ANGLE token manager
    /// @param _core Fei Core for reference
    /// @param _initialDelegate initial delegate for snapshot votes
    constructor(
        address _core,
        address _initialDelegate
    ) SnapshotDelegatorPCVDeposit(
        _core,
        IERC20(0x31429d1856aD1377A8A0079410B297e1a9e214c2), // ANGLE
        keccak256("anglegovernance.eth"),
        _initialDelegate
    ) VoteEscrowTokenManager(
        IERC20(0x31429d1856aD1377A8A0079410B297e1a9e214c2), // ANGLE
        IVeToken(0x0C462Dbb9EC8cD1630f1728B2CFD2769d09f0dd5), // veANGLE
        4 * 365 * 86400 // 4 years
    ) LiquidityGaugeManager() OZGovernorVoter() {}

    /// @notice returns total balance of PCV in the Deposit
    function balance() public view override returns (uint256) {
        return _totalTokens(); // liquid and vote-escrowed tokens
    }
}
