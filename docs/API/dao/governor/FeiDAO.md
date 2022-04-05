## `FeiDAO`






### `constructor(contract ERC20VotesComp tribe, contract ICompoundTimelock timelock, address guardian)` (public)





### `votingDelay() → uint256` (public)





### `votingPeriod() → uint256` (public)





### `quorum(uint256) → uint256` (public)





### `proposalThreshold() → uint256` (public)





### `setVotingDelay(uint256 newVotingDelay)` (public)





### `setVotingPeriod(uint256 newVotingPeriod)` (public)





### `setQuorum(uint256 newQuorum)` (public)





### `setProposalThreshold(uint256 newProposalThreshold)` (public)





### `__rollback(uint256 eta)` (external)

one-time option to roll back the DAO to old GovernorAlpha


guardian-only, and expires after the deadline. This function is here as a fallback in case something goes wrong.

### `__executeRollback()` (external)

complete the rollback



### `getVotes(address account, uint256 blockNumber) → uint256` (public)





### `state(uint256 proposalId) → enum IGovernor.ProposalState` (public)





### `propose(address[] targets, uint256[] values, bytes[] calldatas, string description) → uint256` (public)





### `_execute(uint256 proposalId, address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash)` (internal)





### `_cancel(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) → uint256` (internal)





### `_executor() → address` (internal)





### `supportsInterface(bytes4 interfaceId) → bool` (public)






### `QuorumUpdated(uint256 oldQuorum, uint256 newQuorum)`





### `VotingDelayUpdated(uint256 oldVotingDelay, uint256 newVotingDelay)`





### `VotingPeriodUpdated(uint256 oldVotingPeriod, uint256 newVotingPeriod)`





### `ProposalThresholdUpdated(uint256 oldProposalThreshold, uint256 newProposalThreshold)`





### `RollbackQueued(uint256 eta)`





### `Rollback()`







