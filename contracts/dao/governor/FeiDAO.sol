// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/governance/compatibility/GovernorCompatibilityBravo.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockCompound.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesComp.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20VotesComp.sol";

// Forked functionality from https://github.com/unlock-protocol/unlock/blob/master/smart-contracts/contracts/UnlockProtocolGovernor.sol

contract FeiDAO is GovernorCompatibilityBravo, GovernorVotesComp, GovernorTimelockCompound {
    uint256 private _votingDelay = 1; // reduce voting delay to 1 block
    uint256 private _votingPeriod = 13000; // extend voting period to 48h
    uint256 private _quorum = 25_000_000e18;
    uint256 private _proposalThreshold = 2_500_000e18;

    address private _guardian;
    uint256 private _eta;
    address public constant BACKUP_GOVERNOR = 0x4C895973334Af8E06fd6dA4f723Ac24A5f259e6B;
    uint256 public constant ROLLBACK_DEADLINE = 1635724800; // Nov 1, 2021 midnight UTC

    constructor(
        ERC20VotesComp tribe,
        ICompoundTimelock timelock,
        address guardian
    ) GovernorVotesComp(tribe) GovernorTimelockCompound(timelock) Governor("Fei DAO") {
        _guardian = guardian;
    }

    /*
     * Events to track params changes
     */
    event QuorumUpdated(uint256 oldQuorum, uint256 newQuorum);
    event VotingDelayUpdated(uint256 oldVotingDelay, uint256 newVotingDelay);
    event VotingPeriodUpdated(uint256 oldVotingPeriod, uint256 newVotingPeriod);
    event ProposalThresholdUpdated(uint256 oldProposalThreshold, uint256 newProposalThreshold);
    event RollbackQueued(uint256 eta);
    event Rollback();

    function votingDelay() public view override returns (uint256) {
        return _votingDelay;
    }

    function votingPeriod() public view override returns (uint256) {
        return _votingPeriod;
    }

    function quorum(uint256) public view override returns (uint256) {
        return _quorum;
    }

    function proposalThreshold() public view override returns (uint256) {
        return _proposalThreshold;
    }

    // governance setters
    function setVotingDelay(uint256 newVotingDelay) public onlyGovernance {
        uint256 oldVotingDelay = _votingDelay;
        _votingDelay = newVotingDelay;
        emit VotingDelayUpdated(oldVotingDelay, newVotingDelay);
    }

    function setVotingPeriod(uint256 newVotingPeriod) public onlyGovernance {
        uint256 oldVotingPeriod = _votingPeriod;
        _votingPeriod = newVotingPeriod;
        emit VotingPeriodUpdated(oldVotingPeriod, newVotingPeriod);
    }

    function setQuorum(uint256 newQuorum) public onlyGovernance {
        uint256 oldQuorum = _quorum;
        _quorum = newQuorum;
        emit QuorumUpdated(oldQuorum, newQuorum);
    }

    function setProposalThreshold(uint256 newProposalThreshold) public onlyGovernance {
        uint256 oldProposalThreshold = _proposalThreshold;
        _proposalThreshold = newProposalThreshold;
        emit ProposalThresholdUpdated(oldProposalThreshold, newProposalThreshold);
    }

    /// @notice one-time option to roll back the DAO to old GovernorAlpha
    /// @dev guardian-only, and expires after the deadline. This function is here as a fallback in case something goes wrong.
    function __rollback(uint256 eta) external {
        require(msg.sender == _guardian, "FeiDAO: caller not guardian");
        // Deleting guardian prevents multiple triggers of this function
        _guardian = address(0);

        require(eta <= ROLLBACK_DEADLINE, "FeiDAO: rollback expired");
        _eta = eta;

        ICompoundTimelock _timelock = ICompoundTimelock(payable(timelock()));
        _timelock.queueTransaction(timelock(), 0, "setPendingAdmin(address)", abi.encode(BACKUP_GOVERNOR), eta);

        emit RollbackQueued(eta);
    }

    /// @notice complete the rollback
    function __executeRollback() external {
        require(_eta <= block.timestamp, "FeiDAO: too soon");
        require(_guardian == address(0), "FeiDAO: no queue");

        ICompoundTimelock _timelock = ICompoundTimelock(payable(timelock()));
        _timelock.executeTransaction(timelock(), 0, "setPendingAdmin(address)", abi.encode(BACKUP_GOVERNOR), _eta);

        emit Rollback();
    }

    // The following functions are overrides required by Solidity.
    function getVotes(address account, uint256 blockNumber)
        public
        view
        override(Governor, IGovernor)
        returns (uint256)
    {
        return super.getVotes(account, blockNumber);
    }

    function state(uint256 proposalId)
        public
        view
        override(IGovernor, Governor, GovernorTimelockCompound)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(IGovernor, Governor, GovernorCompatibilityBravo) returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockCompound) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockCompound) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor, GovernorTimelockCompound) returns (address) {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(IERC165, Governor, GovernorTimelockCompound)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
