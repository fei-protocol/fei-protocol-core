## `GovernorAlpha`






### `quorumVotes() → uint256` (public)

The number of votes in support of a proposal required in order for a quorum to be reached and for a vote to succeed



### `proposalThreshold() → uint256` (public)

The number of votes required in order for a voter to become a proposer



### `proposalMaxOperations() → uint256` (public)

The maximum number of actions that can be included in a proposal



### `votingDelay() → uint256` (public)

The delay before voting on a proposal may take place, once proposed



### `votingPeriod() → uint256` (public)

The duration of voting on a proposal, in blocks



### `constructor(address timelock_, address tribe_, address guardian_)` (public)





### `propose(address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, string description) → uint256` (public)





### `queue(uint256 proposalId)` (public)





### `_queueOrRevert(address target, uint256 value, string signature, bytes data, uint256 eta)` (internal)





### `execute(uint256 proposalId)` (public)





### `cancel(uint256 proposalId)` (public)





### `getActions(uint256 proposalId) → address[] targets, uint256[] values, string[] signatures, bytes[] calldatas` (public)





### `getReceipt(uint256 proposalId, address voter) → struct GovernorAlpha.Receipt` (public)





### `state(uint256 proposalId) → enum GovernorAlpha.ProposalState` (public)





### `castVote(uint256 proposalId, bool support)` (public)





### `castVoteBySig(uint256 proposalId, bool support, uint8 v, bytes32 r, bytes32 s)` (public)





### `_castVote(address voter, uint256 proposalId, bool support)` (internal)





### `__acceptAdmin()` (public)





### `__abdicate()` (public)





### `__transferGuardian(address newGuardian)` (public)





### `__queueSetTimelockPendingAdmin(address newPendingAdmin, uint256 eta)` (public)





### `__executeSetTimelockPendingAdmin(address newPendingAdmin, uint256 eta)` (public)





### `add256(uint256 a, uint256 b) → uint256` (internal)





### `sub256(uint256 a, uint256 b) → uint256` (internal)





### `getChainId() → uint256` (internal)






### `ProposalCreated(uint256 id, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)`

An event emitted when a new proposal is created



### `VoteCast(address voter, uint256 proposalId, bool support, uint256 votes)`

An event emitted when a vote has been cast on a proposal



### `ProposalCanceled(uint256 id)`

An event emitted when a proposal has been canceled



### `ProposalQueued(uint256 id, uint256 eta)`

An event emitted when a proposal has been queued in the Timelock



### `ProposalExecuted(uint256 id)`

An event emitted when a proposal has been executed in the Timelock




### `Proposal`


uint256 id


address proposer


uint256 eta


address[] targets


uint256[] values


string[] signatures


bytes[] calldatas


uint256 startBlock


uint256 endBlock


uint256 forVotes


uint256 againstVotes


bool canceled


bool executed


mapping(address => struct GovernorAlpha.Receipt) receipts


### `Receipt`


bool hasVoted


bool support


uint96 votes



### `ProposalState`


























