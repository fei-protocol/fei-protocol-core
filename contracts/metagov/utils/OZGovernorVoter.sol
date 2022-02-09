// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../../refs/CoreRef.sol";
import "../../core/TribeRoles.sol";

interface IOZGovernor {
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external;
    function castVote(uint256 proposalId, uint8 support) external returns (uint256);
}

/// @title Abstract class to interact with an OZ governor.
/// @author Fei Protocol
abstract contract OZGovernorVoter is CoreRef {

    /// @notice propose a new proposal on the target governor.
    function propose(
        IOZGovernor governor,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external onlyTribeRole(TribeRoles.METAGOVERNANCE_VOTE_ADMIN) {
        governor.propose(targets, values, calldatas, description);
    }

    /// @notice cast a vote on a given proposal on the target governor.
    function castVote(
        IOZGovernor governor,
        uint256 proposalId,
        uint8 support
    ) external onlyTribeRole(TribeRoles.METAGOVERNANCE_VOTE_ADMIN) {
        governor.castVote(proposalId, support);
    }
}
