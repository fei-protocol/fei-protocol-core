// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {Governor, IGovernor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorVotesComp, IERC165} from "@openzeppelin/contracts/governance/extensions/GovernorVotesComp.sol";
import {ERC20VotesComp} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20VotesComp.sol";
import {CoreRef} from "../../refs/CoreRef.sol";
import {TribeRoles} from "../../core/TribeRoles.sol";
import {GovernorQuickReaction} from "./GovernorQuickReaction.sol";
import {GovernorCountingFor} from "./GovernorCountingFor.sol";

/// @title Nope DAO
/// @notice A DAO that is able to veto Tribe optimistic governance proposals
contract NopeDAO is Governor, GovernorSettings, GovernorVotesComp, GovernorQuickReaction, GovernorCountingFor, CoreRef {
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

    /// @notice Custom, convenience propose method to veto an optimistic pod proposal
    /// @param podId The podId of the pod to veto
    /// @param timelockProposalId The timelock proposal ID of the proposal to be vetoed
    /// @param podAdminGateway The pod admin gateway contract that administers the veto
    /// @param description Description of the proposal
    function propose(
        uint256 podId,
        bytes32 timelockProposalId,
        address podAdminGateway,
        string memory description
    ) public returns (uint256) {
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas) = getPodVetoParams(
            podId,
            timelockProposalId,
            podAdminGateway
        );
        return propose(targets, values, calldatas, description);
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    /// @notice Construct DAO proposal parameters from the veto parameters, such as podId
    /// @param podId The podId of the pod to veto
    /// @param timelockProposalId The timelock proposal ID of the proposal to be vetoed
    /// @param podAdminGateway The pod admin gateway contract that administers the veto
    function getPodVetoParams(
        uint256 podId,
        bytes32 timelockProposalId,
        address podAdminGateway
    )
        internal
        pure
        returns (
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas
        )
    {
        targets = new address[](1);
        targets[0] = podAdminGateway;

        values = new uint256[](1);
        values[0] = uint256(0);

        calldatas = new bytes[](1);
        bytes memory data = abi.encodePacked(
            bytes4(keccak256(bytes("veto(uint256,bytes32)"))),
            podId,
            timelockProposalId
        );
        calldatas[0] = data;
    }

    /// @notice Convenience propose method based on veto parameters
    /// @param podId The podId of the pod to veto
    /// @param timelockProposalId The timelock proposal ID of the proposal to be vetoed
    /// @param podAdminGateway The pod admin gateway contract that administers the veto
    /// @param description Description of the proposal
    function execute(
        uint256 podId,
        bytes32 timelockProposalId,
        address podAdminGateway,
        string memory description
    ) public {
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas) = getPodVetoParams(
            podId,
            timelockProposalId,
            podAdminGateway
        );
        execute(targets, values, calldatas, keccak256(bytes(description)));
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
