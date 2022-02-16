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
    ) external returns (uint256 proposalId);
    function castVote(uint256 proposalId, uint8 support) external returns (uint256 weight);
    function state(uint256 proposalId) external view returns (uint256);
}

/// @title Abstract class to interact with an OZ governor.
/// @author Fei Protocol
abstract contract OZGovernorVoter is CoreRef {

    // Events
    event Proposed(IOZGovernor indexed governor, uint256 proposalId);
    event Voted(IOZGovernor indexed governor, uint256 proposalId, uint256 weight, uint8 support);

    /// @notice propose a new proposal on the target governor.
    function propose(
        IOZGovernor governor,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external onlyTribeRole(TribeRoles.METAGOVERNANCE_VOTE_ADMIN) returns (uint256) {
        uint256 proposalId = governor.propose(targets, values, calldatas, description);
        emit Proposed(governor, proposalId);
        return proposalId;
    }

    /// @notice cast a vote on a given proposal on the target governor.
    function castVote(
        IOZGovernor governor,
        uint256 proposalId,
        uint8 support
    ) external onlyTribeRole(TribeRoles.METAGOVERNANCE_VOTE_ADMIN) returns (uint256) {
        uint256 weight = governor.castVote(proposalId, support);
        emit Voted(governor, proposalId, weight, support);
        return weight;
    }
}
