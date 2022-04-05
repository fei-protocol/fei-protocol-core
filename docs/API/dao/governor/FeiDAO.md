## <span id="FeiDAO"></span> `FeiDAO`



- [`onlyGovernance()`][Governor-onlyGovernance--]
- [`constructor(contract ERC20VotesComp tribe, contract ICompoundTimelock timelock, address guardian)`][FeiDAO-constructor-contract-ERC20VotesComp-contract-ICompoundTimelock-address-]
- [`votingDelay()`][FeiDAO-votingDelay--]
- [`votingPeriod()`][FeiDAO-votingPeriod--]
- [`quorum(uint256)`][FeiDAO-quorum-uint256-]
- [`proposalThreshold()`][FeiDAO-proposalThreshold--]
- [`setVotingDelay(uint256 newVotingDelay)`][FeiDAO-setVotingDelay-uint256-]
- [`setVotingPeriod(uint256 newVotingPeriod)`][FeiDAO-setVotingPeriod-uint256-]
- [`setQuorum(uint256 newQuorum)`][FeiDAO-setQuorum-uint256-]
- [`setProposalThreshold(uint256 newProposalThreshold)`][FeiDAO-setProposalThreshold-uint256-]
- [`__rollback(uint256 eta)`][FeiDAO-__rollback-uint256-]
- [`__executeRollback()`][FeiDAO-__executeRollback--]
- [`getVotes(address account, uint256 blockNumber)`][FeiDAO-getVotes-address-uint256-]
- [`state(uint256 proposalId)`][FeiDAO-state-uint256-]
- [`propose(address[] targets, uint256[] values, bytes[] calldatas, string description)`][FeiDAO-propose-address---uint256---bytes---string-]
- [`_execute(uint256 proposalId, address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash)`][FeiDAO-_execute-uint256-address---uint256---bytes---bytes32-]
- [`_cancel(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash)`][FeiDAO-_cancel-address---uint256---bytes---bytes32-]
- [`_executor()`][FeiDAO-_executor--]
- [`supportsInterface(bytes4 interfaceId)`][FeiDAO-supportsInterface-bytes4-]
- [`timelock()`][GovernorTimelockCompound-timelock--]
- [`proposalEta(uint256 proposalId)`][GovernorTimelockCompound-proposalEta-uint256-]
- [`queue(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash)`][GovernorTimelockCompound-queue-address---uint256---bytes---bytes32-]
- [`__acceptAdmin()`][GovernorTimelockCompound-__acceptAdmin--]
- [`updateTimelock(contract ICompoundTimelock newTimelock)`][GovernorTimelockCompound-updateTimelock-contract-ICompoundTimelock-]
- [`COUNTING_MODE()`][GovernorCompatibilityBravo-COUNTING_MODE--]
- [`propose(address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, string description)`][GovernorCompatibilityBravo-propose-address---uint256---string---bytes---string-]
- [`queue(uint256 proposalId)`][GovernorCompatibilityBravo-queue-uint256-]
- [`execute(uint256 proposalId)`][GovernorCompatibilityBravo-execute-uint256-]
- [`cancel(uint256 proposalId)`][GovernorCompatibilityBravo-cancel-uint256-]
- [`proposals(uint256 proposalId)`][GovernorCompatibilityBravo-proposals-uint256-]
- [`getActions(uint256 proposalId)`][GovernorCompatibilityBravo-getActions-uint256-]
- [`getReceipt(uint256 proposalId, address voter)`][GovernorCompatibilityBravo-getReceipt-uint256-address-]
- [`quorumVotes()`][GovernorCompatibilityBravo-quorumVotes--]
- [`hasVoted(uint256 proposalId, address account)`][GovernorCompatibilityBravo-hasVoted-uint256-address-]
- [`_quorumReached(uint256 proposalId)`][GovernorCompatibilityBravo-_quorumReached-uint256-]
- [`_voteSucceeded(uint256 proposalId)`][GovernorCompatibilityBravo-_voteSucceeded-uint256-]
- [`_countVote(uint256 proposalId, address account, uint8 support, uint256 weight)`][GovernorCompatibilityBravo-_countVote-uint256-address-uint8-uint256-]
- [`receive()`][Governor-receive--]
- [`name()`][Governor-name--]
- [`version()`][Governor-version--]
- [`hashProposal(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash)`][Governor-hashProposal-address---uint256---bytes---bytes32-]
- [`proposalSnapshot(uint256 proposalId)`][Governor-proposalSnapshot-uint256-]
- [`proposalDeadline(uint256 proposalId)`][Governor-proposalDeadline-uint256-]
- [`execute(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash)`][Governor-execute-address---uint256---bytes---bytes32-]
- [`castVote(uint256 proposalId, uint8 support)`][Governor-castVote-uint256-uint8-]
- [`castVoteWithReason(uint256 proposalId, uint8 support, string reason)`][Governor-castVoteWithReason-uint256-uint8-string-]
- [`castVoteBySig(uint256 proposalId, uint8 support, uint8 v, bytes32 r, bytes32 s)`][Governor-castVoteBySig-uint256-uint8-uint8-bytes32-bytes32-]
- [`_castVote(uint256 proposalId, address account, uint8 support, string reason)`][Governor-_castVote-uint256-address-uint8-string-]
- [`relay(address target, uint256 value, bytes data)`][Governor-relay-address-uint256-bytes-]
- [`_domainSeparatorV4()`][EIP712-_domainSeparatorV4--]
- [`_hashTypedDataV4(bytes32 structHash)`][EIP712-_hashTypedDataV4-bytes32-]
- [`_msgSender()`][Context-_msgSender--]
- [`_msgData()`][Context-_msgData--]
- [`QuorumUpdated(uint256 oldQuorum, uint256 newQuorum)`][FeiDAO-QuorumUpdated-uint256-uint256-]
- [`VotingDelayUpdated(uint256 oldVotingDelay, uint256 newVotingDelay)`][FeiDAO-VotingDelayUpdated-uint256-uint256-]
- [`VotingPeriodUpdated(uint256 oldVotingPeriod, uint256 newVotingPeriod)`][FeiDAO-VotingPeriodUpdated-uint256-uint256-]
- [`ProposalThresholdUpdated(uint256 oldProposalThreshold, uint256 newProposalThreshold)`][FeiDAO-ProposalThresholdUpdated-uint256-uint256-]
- [`RollbackQueued(uint256 eta)`][FeiDAO-RollbackQueued-uint256-]
- [`Rollback()`][FeiDAO-Rollback--]
- [`TimelockChange(address oldTimelock, address newTimelock)`][GovernorTimelockCompound-TimelockChange-address-address-]
- [`ProposalQueued(uint256 proposalId, uint256 eta)`][IGovernorTimelock-ProposalQueued-uint256-uint256-]
- [`ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)`][IGovernor-ProposalCreated-uint256-address-address---uint256---string---bytes---uint256-uint256-string-]
- [`ProposalCanceled(uint256 proposalId)`][IGovernor-ProposalCanceled-uint256-]
- [`ProposalExecuted(uint256 proposalId)`][IGovernor-ProposalExecuted-uint256-]
- [`VoteCast(address voter, uint256 proposalId, uint8 support, uint256 weight, string reason)`][IGovernor-VoteCast-address-uint256-uint8-uint256-string-]
### <span id="FeiDAO-constructor-contract-ERC20VotesComp-contract-ICompoundTimelock-address-"></span> `constructor(contract ERC20VotesComp tribe, contract ICompoundTimelock timelock, address guardian)` (public)



### <span id="FeiDAO-votingDelay--"></span> `votingDelay() → uint256` (public)



### <span id="FeiDAO-votingPeriod--"></span> `votingPeriod() → uint256` (public)



### <span id="FeiDAO-quorum-uint256-"></span> `quorum(uint256) → uint256` (public)



### <span id="FeiDAO-proposalThreshold--"></span> `proposalThreshold() → uint256` (public)



### <span id="FeiDAO-setVotingDelay-uint256-"></span> `setVotingDelay(uint256 newVotingDelay)` (public)



### <span id="FeiDAO-setVotingPeriod-uint256-"></span> `setVotingPeriod(uint256 newVotingPeriod)` (public)



### <span id="FeiDAO-setQuorum-uint256-"></span> `setQuorum(uint256 newQuorum)` (public)



### <span id="FeiDAO-setProposalThreshold-uint256-"></span> `setProposalThreshold(uint256 newProposalThreshold)` (public)



### <span id="FeiDAO-__rollback-uint256-"></span> `__rollback(uint256 eta)` (external)

guardian-only, and expires after the deadline. This function is here as a fallback in case something goes wrong.

### <span id="FeiDAO-__executeRollback--"></span> `__executeRollback()` (external)



### <span id="FeiDAO-getVotes-address-uint256-"></span> `getVotes(address account, uint256 blockNumber) → uint256` (public)



### <span id="FeiDAO-state-uint256-"></span> `state(uint256 proposalId) → enum IGovernor.ProposalState` (public)



### <span id="FeiDAO-propose-address---uint256---bytes---string-"></span> `propose(address[] targets, uint256[] values, bytes[] calldatas, string description) → uint256` (public)



### <span id="FeiDAO-_execute-uint256-address---uint256---bytes---bytes32-"></span> `_execute(uint256 proposalId, address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash)` (internal)



### <span id="FeiDAO-_cancel-address---uint256---bytes---bytes32-"></span> `_cancel(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) → uint256` (internal)



### <span id="FeiDAO-_executor--"></span> `_executor() → address` (internal)



### <span id="FeiDAO-supportsInterface-bytes4-"></span> `supportsInterface(bytes4 interfaceId) → bool` (public)



### <span id="FeiDAO-QuorumUpdated-uint256-uint256-"></span> `QuorumUpdated(uint256 oldQuorum, uint256 newQuorum)`



### <span id="FeiDAO-VotingDelayUpdated-uint256-uint256-"></span> `VotingDelayUpdated(uint256 oldVotingDelay, uint256 newVotingDelay)`



### <span id="FeiDAO-VotingPeriodUpdated-uint256-uint256-"></span> `VotingPeriodUpdated(uint256 oldVotingPeriod, uint256 newVotingPeriod)`



### <span id="FeiDAO-ProposalThresholdUpdated-uint256-uint256-"></span> `ProposalThresholdUpdated(uint256 oldProposalThreshold, uint256 newProposalThreshold)`



### <span id="FeiDAO-RollbackQueued-uint256-"></span> `RollbackQueued(uint256 eta)`



### <span id="FeiDAO-Rollback--"></span> `Rollback()`



