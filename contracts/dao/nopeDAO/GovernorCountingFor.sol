// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.0;

import {Governor, IGovernor} from "@openzeppelin/contracts/governance/Governor.sol";

/**
 * @dev Extension of {Governor} for affirmative FOR vote only counting
 */
abstract contract GovernorCountingFor is Governor {
    /// @notice Structure to maintain number of forVotes and who hasVoted
    struct ProposalVote {
        uint256 forVotes;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => ProposalVote) private _proposalVotes;

    /**
     * @dev See {IGovernor-COUNTING_MODE}.
     *      quorum=bravo, means that only FOR votes are counted towards quorum
     *      support key removed
     */
    // solhint-disable-next-line func-name-mixedcase
    function COUNTING_MODE() public pure virtual override returns (string memory) {
        return "quorum=bravo";
    }

    /**
     * @dev See {IGovernor-hasVoted}.
     */
    function hasVoted(uint256 proposalId, address account) public view virtual override returns (bool) {
        return _proposalVotes[proposalId].hasVoted[account];
    }

    /**
     * @dev Accessor to the internal vote counts. Returns the number of For votes
     */
    function proposalVotes(uint256 proposalId) public view virtual returns (uint256 forVotes) {
        ProposalVote storage proposalvote = _proposalVotes[proposalId];
        return (proposalvote.forVotes);
    }

    /**
     * @dev See {Governor-_quorumReached}.
     */
    function _quorumReached(uint256 proposalId) internal view virtual override returns (bool) {
        ProposalVote storage proposalvote = _proposalVotes[proposalId];

        return quorum(proposalSnapshot(proposalId)) <= proposalvote.forVotes;
    }

    /**
     * @dev See {Governor-_voteSucceeded}. In this module, the vote is always successful. Barrier to execution is that
     *      quorum must be reached.
     *
     *      Method maintained here to be compatible with the interface that a counting module must implement
     */
    function _voteSucceeded(uint256 proposalId) internal view virtual override returns (bool) {
        return true;
    }

    /**
     * @dev See {Governor-_countVote}. In this module, only one vote type FOR is enabled
     */
    function _countVote(
        uint256 proposalId,
        address account,
        uint8 support,
        uint256 weight,
        bytes memory // params
    ) internal virtual override {
        ProposalVote storage proposalvote = _proposalVotes[proposalId];

        require(!proposalvote.hasVoted[account], "GovernorCountingFor: vote already cast");
        proposalvote.hasVoted[account] = true;

        require(support == uint8(1), "GovernorCountingFor: only FOR votes supported");
        proposalvote.forVotes += weight;
    }
}
