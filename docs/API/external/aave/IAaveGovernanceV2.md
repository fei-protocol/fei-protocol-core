## <span id="IAaveGovernanceV2"></span> `IAaveGovernanceV2`



- [`create(contract IExecutorWithTimelock executor, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, bool[] withDelegatecalls, bytes32 ipfsHash)`][IAaveGovernanceV2-create-contract-IExecutorWithTimelock-address---uint256---string---bytes---bool---bytes32-]
- [`cancel(uint256 proposalId)`][IAaveGovernanceV2-cancel-uint256-]
- [`queue(uint256 proposalId)`][IAaveGovernanceV2-queue-uint256-]
- [`execute(uint256 proposalId)`][IAaveGovernanceV2-execute-uint256-]
- [`submitVote(uint256 proposalId, bool support)`][IAaveGovernanceV2-submitVote-uint256-bool-]
- [`submitVoteBySignature(uint256 proposalId, bool support, uint8 v, bytes32 r, bytes32 s)`][IAaveGovernanceV2-submitVoteBySignature-uint256-bool-uint8-bytes32-bytes32-]
- [`setGovernanceStrategy(address governanceStrategy)`][IAaveGovernanceV2-setGovernanceStrategy-address-]
- [`setVotingDelay(uint256 votingDelay)`][IAaveGovernanceV2-setVotingDelay-uint256-]
- [`authorizeExecutors(address[] executors)`][IAaveGovernanceV2-authorizeExecutors-address---]
- [`unauthorizeExecutors(address[] executors)`][IAaveGovernanceV2-unauthorizeExecutors-address---]
- [`__abdicate()`][IAaveGovernanceV2-__abdicate--]
- [`getGovernanceStrategy()`][IAaveGovernanceV2-getGovernanceStrategy--]
- [`getVotingDelay()`][IAaveGovernanceV2-getVotingDelay--]
- [`isExecutorAuthorized(address executor)`][IAaveGovernanceV2-isExecutorAuthorized-address-]
- [`getGuardian()`][IAaveGovernanceV2-getGuardian--]
- [`getProposalsCount()`][IAaveGovernanceV2-getProposalsCount--]
- [`getProposalById(uint256 proposalId)`][IAaveGovernanceV2-getProposalById-uint256-]
- [`getVoteOnProposal(uint256 proposalId, address voter)`][IAaveGovernanceV2-getVoteOnProposal-uint256-address-]
- [`getProposalState(uint256 proposalId)`][IAaveGovernanceV2-getProposalState-uint256-]
- [`ProposalCreated(uint256 id, address creator, contract IExecutorWithTimelock executor, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, bool[] withDelegatecalls, uint256 startBlock, uint256 endBlock, address strategy, bytes32 ipfsHash)`][IAaveGovernanceV2-ProposalCreated-uint256-address-contract-IExecutorWithTimelock-address---uint256---string---bytes---bool---uint256-uint256-address-bytes32-]
- [`ProposalCanceled(uint256 id)`][IAaveGovernanceV2-ProposalCanceled-uint256-]
- [`ProposalQueued(uint256 id, uint256 executionTime, address initiatorQueueing)`][IAaveGovernanceV2-ProposalQueued-uint256-uint256-address-]
- [`ProposalExecuted(uint256 id, address initiatorExecution)`][IAaveGovernanceV2-ProposalExecuted-uint256-address-]
- [`VoteEmitted(uint256 id, address voter, bool support, uint256 votingPower)`][IAaveGovernanceV2-VoteEmitted-uint256-address-bool-uint256-]
- [`GovernanceStrategyChanged(address newStrategy, address initiatorChange)`][IAaveGovernanceV2-GovernanceStrategyChanged-address-address-]
- [`VotingDelayChanged(uint256 newVotingDelay, address initiatorChange)`][IAaveGovernanceV2-VotingDelayChanged-uint256-address-]
- [`ExecutorAuthorized(address executor)`][IAaveGovernanceV2-ExecutorAuthorized-address-]
- [`ExecutorUnauthorized(address executor)`][IAaveGovernanceV2-ExecutorUnauthorized-address-]
### <span id="IAaveGovernanceV2-create-contract-IExecutorWithTimelock-address---uint256---string---bytes---bool---bytes32-"></span> `create(contract IExecutorWithTimelock executor, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, bool[] withDelegatecalls, bytes32 ipfsHash) → uint256` (external)

Creates a Proposal (needs Proposition Power of creator > Threshold)


### <span id="IAaveGovernanceV2-cancel-uint256-"></span> `cancel(uint256 proposalId)` (external)

Cancels a Proposal,
either at anytime by guardian
or when proposal is Pending/Active and threshold no longer reached


### <span id="IAaveGovernanceV2-queue-uint256-"></span> `queue(uint256 proposalId)` (external)

Queue the proposal (If Proposal Succeeded)


### <span id="IAaveGovernanceV2-execute-uint256-"></span> `execute(uint256 proposalId)` (external)

Execute the proposal (If Proposal Queued)


### <span id="IAaveGovernanceV2-submitVote-uint256-bool-"></span> `submitVote(uint256 proposalId, bool support)` (external)

Function allowing msg.sender to vote for/against a proposal


### <span id="IAaveGovernanceV2-submitVoteBySignature-uint256-bool-uint8-bytes32-bytes32-"></span> `submitVoteBySignature(uint256 proposalId, bool support, uint8 v, bytes32 r, bytes32 s)` (external)

Function to register the vote of user that has voted offchain via signature


### <span id="IAaveGovernanceV2-setGovernanceStrategy-address-"></span> `setGovernanceStrategy(address governanceStrategy)` (external)

Set new GovernanceStrategy
Note: owner should be a timelocked executor, so needs to make a proposal


### <span id="IAaveGovernanceV2-setVotingDelay-uint256-"></span> `setVotingDelay(uint256 votingDelay)` (external)

Set new Voting Delay (delay before a newly created proposal can be voted on)
Note: owner should be a timelocked executor, so needs to make a proposal


### <span id="IAaveGovernanceV2-authorizeExecutors-address---"></span> `authorizeExecutors(address[] executors)` (external)

Add new addresses to the list of authorized executors


### <span id="IAaveGovernanceV2-unauthorizeExecutors-address---"></span> `unauthorizeExecutors(address[] executors)` (external)

Remove addresses to the list of authorized executors


### <span id="IAaveGovernanceV2-__abdicate--"></span> `__abdicate()` (external)

Let the guardian abdicate from its priviledged rights


### <span id="IAaveGovernanceV2-getGovernanceStrategy--"></span> `getGovernanceStrategy() → address` (external)

Getter of the current GovernanceStrategy address


### <span id="IAaveGovernanceV2-getVotingDelay--"></span> `getVotingDelay() → uint256` (external)

Getter of the current Voting Delay (delay before a created proposal can be voted on)
Different from the voting duration


### <span id="IAaveGovernanceV2-isExecutorAuthorized-address-"></span> `isExecutorAuthorized(address executor) → bool` (external)

Returns whether an address is an authorized executor


### <span id="IAaveGovernanceV2-getGuardian--"></span> `getGuardian() → address` (external)

Getter the address of the guardian, that can mainly cancel proposals


### <span id="IAaveGovernanceV2-getProposalsCount--"></span> `getProposalsCount() → uint256` (external)

Getter of the proposal count (the current number of proposals ever created)


### <span id="IAaveGovernanceV2-getProposalById-uint256-"></span> `getProposalById(uint256 proposalId) → struct IAaveGovernanceV2.ProposalWithoutVotes` (external)

Getter of a proposal by id


### <span id="IAaveGovernanceV2-getVoteOnProposal-uint256-address-"></span> `getVoteOnProposal(uint256 proposalId, address voter) → struct IAaveGovernanceV2.Vote` (external)

Getter of the Vote of a voter about a proposal
Note: Vote is a struct: ({bool support, uint248 votingPower})


### <span id="IAaveGovernanceV2-getProposalState-uint256-"></span> `getProposalState(uint256 proposalId) → enum IAaveGovernanceV2.ProposalState` (external)

Get the current state of a proposal


### <span id="IAaveGovernanceV2-ProposalCreated-uint256-address-contract-IExecutorWithTimelock-address---uint256---string---bytes---bool---uint256-uint256-address-bytes32-"></span> `ProposalCreated(uint256 id, address creator, contract IExecutorWithTimelock executor, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, bool[] withDelegatecalls, uint256 startBlock, uint256 endBlock, address strategy, bytes32 ipfsHash)`

emitted when a new proposal is created


### <span id="IAaveGovernanceV2-ProposalCanceled-uint256-"></span> `ProposalCanceled(uint256 id)`

emitted when a proposal is canceled


### <span id="IAaveGovernanceV2-ProposalQueued-uint256-uint256-address-"></span> `ProposalQueued(uint256 id, uint256 executionTime, address initiatorQueueing)`

emitted when a proposal is queued


### <span id="IAaveGovernanceV2-ProposalExecuted-uint256-address-"></span> `ProposalExecuted(uint256 id, address initiatorExecution)`

emitted when a proposal is executed


### <span id="IAaveGovernanceV2-VoteEmitted-uint256-address-bool-uint256-"></span> `VoteEmitted(uint256 id, address voter, bool support, uint256 votingPower)`

emitted when a vote is registered


### <span id="IAaveGovernanceV2-GovernanceStrategyChanged-address-address-"></span> `GovernanceStrategyChanged(address newStrategy, address initiatorChange)`



### <span id="IAaveGovernanceV2-VotingDelayChanged-uint256-address-"></span> `VotingDelayChanged(uint256 newVotingDelay, address initiatorChange)`



### <span id="IAaveGovernanceV2-ExecutorAuthorized-address-"></span> `ExecutorAuthorized(address executor)`



### <span id="IAaveGovernanceV2-ExecutorUnauthorized-address-"></span> `ExecutorUnauthorized(address executor)`



