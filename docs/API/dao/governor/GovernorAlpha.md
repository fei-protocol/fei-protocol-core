## <span id="GovernorAlpha"></span> `GovernorAlpha`



- [`quorumVotes()`][GovernorAlpha-quorumVotes--]
- [`proposalThreshold()`][GovernorAlpha-proposalThreshold--]
- [`proposalMaxOperations()`][GovernorAlpha-proposalMaxOperations--]
- [`votingDelay()`][GovernorAlpha-votingDelay--]
- [`votingPeriod()`][GovernorAlpha-votingPeriod--]
- [`constructor(address timelock_, address tribe_, address guardian_)`][GovernorAlpha-constructor-address-address-address-]
- [`propose(address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, string description)`][GovernorAlpha-propose-address---uint256---string---bytes---string-]
- [`queue(uint256 proposalId)`][GovernorAlpha-queue-uint256-]
- [`_queueOrRevert(address target, uint256 value, string signature, bytes data, uint256 eta)`][GovernorAlpha-_queueOrRevert-address-uint256-string-bytes-uint256-]
- [`execute(uint256 proposalId)`][GovernorAlpha-execute-uint256-]
- [`cancel(uint256 proposalId)`][GovernorAlpha-cancel-uint256-]
- [`getActions(uint256 proposalId)`][GovernorAlpha-getActions-uint256-]
- [`getReceipt(uint256 proposalId, address voter)`][GovernorAlpha-getReceipt-uint256-address-]
- [`state(uint256 proposalId)`][GovernorAlpha-state-uint256-]
- [`castVote(uint256 proposalId, bool support)`][GovernorAlpha-castVote-uint256-bool-]
- [`castVoteBySig(uint256 proposalId, bool support, uint8 v, bytes32 r, bytes32 s)`][GovernorAlpha-castVoteBySig-uint256-bool-uint8-bytes32-bytes32-]
- [`_castVote(address voter, uint256 proposalId, bool support)`][GovernorAlpha-_castVote-address-uint256-bool-]
- [`__acceptAdmin()`][GovernorAlpha-__acceptAdmin--]
- [`__abdicate()`][GovernorAlpha-__abdicate--]
- [`__transferGuardian(address newGuardian)`][GovernorAlpha-__transferGuardian-address-]
- [`__queueSetTimelockPendingAdmin(address newPendingAdmin, uint256 eta)`][GovernorAlpha-__queueSetTimelockPendingAdmin-address-uint256-]
- [`__executeSetTimelockPendingAdmin(address newPendingAdmin, uint256 eta)`][GovernorAlpha-__executeSetTimelockPendingAdmin-address-uint256-]
- [`add256(uint256 a, uint256 b)`][GovernorAlpha-add256-uint256-uint256-]
- [`sub256(uint256 a, uint256 b)`][GovernorAlpha-sub256-uint256-uint256-]
- [`getChainId()`][GovernorAlpha-getChainId--]
- [`ProposalCreated(uint256 id, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)`][GovernorAlpha-ProposalCreated-uint256-address-address---uint256---string---bytes---uint256-uint256-string-]
- [`VoteCast(address voter, uint256 proposalId, bool support, uint256 votes)`][GovernorAlpha-VoteCast-address-uint256-bool-uint256-]
- [`ProposalCanceled(uint256 id)`][GovernorAlpha-ProposalCanceled-uint256-]
- [`ProposalQueued(uint256 id, uint256 eta)`][GovernorAlpha-ProposalQueued-uint256-uint256-]
- [`ProposalExecuted(uint256 id)`][GovernorAlpha-ProposalExecuted-uint256-]
### <span id="GovernorAlpha-quorumVotes--"></span> `quorumVotes() → uint256` (public)



### <span id="GovernorAlpha-proposalThreshold--"></span> `proposalThreshold() → uint256` (public)



### <span id="GovernorAlpha-proposalMaxOperations--"></span> `proposalMaxOperations() → uint256` (public)



### <span id="GovernorAlpha-votingDelay--"></span> `votingDelay() → uint256` (public)



### <span id="GovernorAlpha-votingPeriod--"></span> `votingPeriod() → uint256` (public)



### <span id="GovernorAlpha-constructor-address-address-address-"></span> `constructor(address timelock_, address tribe_, address guardian_)` (public)



### <span id="GovernorAlpha-propose-address---uint256---string---bytes---string-"></span> `propose(address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, string description) → uint256` (public)



### <span id="GovernorAlpha-queue-uint256-"></span> `queue(uint256 proposalId)` (public)



### <span id="GovernorAlpha-_queueOrRevert-address-uint256-string-bytes-uint256-"></span> `_queueOrRevert(address target, uint256 value, string signature, bytes data, uint256 eta)` (internal)



### <span id="GovernorAlpha-execute-uint256-"></span> `execute(uint256 proposalId)` (public)



### <span id="GovernorAlpha-cancel-uint256-"></span> `cancel(uint256 proposalId)` (public)



### <span id="GovernorAlpha-getActions-uint256-"></span> `getActions(uint256 proposalId) → address[] targets, uint256[] values, string[] signatures, bytes[] calldatas` (public)



### <span id="GovernorAlpha-getReceipt-uint256-address-"></span> `getReceipt(uint256 proposalId, address voter) → struct GovernorAlpha.Receipt` (public)



### <span id="GovernorAlpha-state-uint256-"></span> `state(uint256 proposalId) → enum GovernorAlpha.ProposalState` (public)



### <span id="GovernorAlpha-castVote-uint256-bool-"></span> `castVote(uint256 proposalId, bool support)` (public)



### <span id="GovernorAlpha-castVoteBySig-uint256-bool-uint8-bytes32-bytes32-"></span> `castVoteBySig(uint256 proposalId, bool support, uint8 v, bytes32 r, bytes32 s)` (public)



### <span id="GovernorAlpha-_castVote-address-uint256-bool-"></span> `_castVote(address voter, uint256 proposalId, bool support)` (internal)



### <span id="GovernorAlpha-__acceptAdmin--"></span> `__acceptAdmin()` (public)



### <span id="GovernorAlpha-__abdicate--"></span> `__abdicate()` (public)



### <span id="GovernorAlpha-__transferGuardian-address-"></span> `__transferGuardian(address newGuardian)` (public)



### <span id="GovernorAlpha-__queueSetTimelockPendingAdmin-address-uint256-"></span> `__queueSetTimelockPendingAdmin(address newPendingAdmin, uint256 eta)` (public)



### <span id="GovernorAlpha-__executeSetTimelockPendingAdmin-address-uint256-"></span> `__executeSetTimelockPendingAdmin(address newPendingAdmin, uint256 eta)` (public)



### <span id="GovernorAlpha-add256-uint256-uint256-"></span> `add256(uint256 a, uint256 b) → uint256` (internal)



### <span id="GovernorAlpha-sub256-uint256-uint256-"></span> `sub256(uint256 a, uint256 b) → uint256` (internal)



### <span id="GovernorAlpha-getChainId--"></span> `getChainId() → uint256` (internal)



### <span id="GovernorAlpha-ProposalCreated-uint256-address-address---uint256---string---bytes---uint256-uint256-string-"></span> `ProposalCreated(uint256 id, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)`



### <span id="GovernorAlpha-VoteCast-address-uint256-bool-uint256-"></span> `VoteCast(address voter, uint256 proposalId, bool support, uint256 votes)`



### <span id="GovernorAlpha-ProposalCanceled-uint256-"></span> `ProposalCanceled(uint256 id)`



### <span id="GovernorAlpha-ProposalQueued-uint256-uint256-"></span> `ProposalQueued(uint256 id, uint256 eta)`



### <span id="GovernorAlpha-ProposalExecuted-uint256-"></span> `ProposalExecuted(uint256 id)`



