// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {Governor, IGovernor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorVotesComp, IERC165} from "@openzeppelin/contracts/governance/extensions/GovernorVotesComp.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {ERC20VotesComp} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20VotesComp.sol";
import {CoreRef} from "../../refs/CoreRef.sol";
import {TribeRoles} from "../../core/TribeRoles.sol";
import {GovernorQuickReaction} from "./GovernorQuickReaction.sol";

contract NopeDAO is
    Governor,
    GovernorSettings,
    GovernorVotesComp,
    GovernorQuickReaction,
    GovernorCountingSimple,
    CoreRef
{
    /// @notice Initial quorum required for a Nope proposal
    uint256 private _quorum = 10_000_000e18;

    /// @notice Additional governance events
    event QuorumUpdated(uint256 oldQuorum, uint256 newQuorum);

    constructor(ERC20VotesComp _tribe, address _core)
        Governor("NopeDAO")
        GovernorSettings(
            0, /* 0 blocks */
            26585, /* 4 days measured in blocks. Assumed 13s block time */
            0
        )
        GovernorVotesComp(_tribe)
        GovernorQuickReaction()
        CoreRef(_core)
    {}

    function quorum(uint256 blockNumber) public view override returns (uint256) {
        return _quorum;
    }

    ////////////     GOVERNOR ONLY FUNCTIONS     //////////////

    /// @notice Override of a Governor Settings function, to restrict to Tribe GOVERNOR
    function setVotingDelay(uint256 newVotingDelay) public override onlyTribeRole(TribeRoles.GOVERNOR) {
        _setVotingDelay(newVotingDelay);
    }

    /// @notice Override of a Governor Settings function, to restrict to Tribe GOVERNOR
    function setVotingPeriod(uint256 newVotingPeriod) public override onlyTribeRole(TribeRoles.GOVERNOR) {
        _setVotingPeriod(newVotingPeriod);
    }

    /// @notice Override of a Governor Settings function, to restrict to Tribe GOVERNOR
    function setProposalThreshold(uint256 newProposalThreshold) public override onlyTribeRole(TribeRoles.GOVERNOR) {
        _setProposalThreshold(newProposalThreshold);
    }

    /// @notice Adjust quorum of NopeDAO. Restricted to GOVERNOR, not part of GovernorSettings
    function setQuorum(uint256 newQuroum) public onlyTribeRole(TribeRoles.GOVERNOR) {
        uint256 oldQuorum = _quorum;
        _quorum = newQuroum;
        emit QuorumUpdated(oldQuorum, newQuroum);
    }

    // The following functions are overrides required by Solidity.

    function votingDelay() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function getVotes(address account, uint256 blockNumber) public view override(Governor) returns (uint256) {
        return super.getVotes(account, blockNumber);
    }

    function state(uint256 proposalId) public view override(GovernorQuickReaction, Governor) returns (ProposalState) {
        return super.state(proposalId);
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(Governor) returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor) returns (address) {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId) public view override(Governor) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
