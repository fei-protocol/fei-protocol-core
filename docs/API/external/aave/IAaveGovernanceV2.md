## `IAaveGovernanceV2`






### `create(contract IExecutorWithTimelock executor, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, bool[] withDelegatecalls, bytes32 ipfsHash) → uint256` (external)



Creates a Proposal (needs Proposition Power of creator > Threshold)


### `cancel(uint256 proposalId)` (external)



Cancels a Proposal,
either at anytime by guardian
or when proposal is Pending/Active and threshold no longer reached


### `queue(uint256 proposalId)` (external)



Queue the proposal (If Proposal Succeeded)


### `execute(uint256 proposalId)` (external)



Execute the proposal (If Proposal Queued)


### `submitVote(uint256 proposalId, bool support)` (external)



Function allowing msg.sender to vote for/against a proposal


### `submitVoteBySignature(uint256 proposalId, bool support, uint8 v, bytes32 r, bytes32 s)` (external)



Function to register the vote of user that has voted offchain via signature


### `setGovernanceStrategy(address governanceStrategy)` (external)



Set new GovernanceStrategy
Note: owner should be a timelocked executor, so needs to make a proposal


### `setVotingDelay(uint256 votingDelay)` (external)



Set new Voting Delay (delay before a newly created proposal can be voted on)
Note: owner should be a timelocked executor, so needs to make a proposal


### `authorizeExecutors(address[] executors)` (external)



Add new addresses to the list of authorized executors


### `unauthorizeExecutors(address[] executors)` (external)



Remove addresses to the list of authorized executors


### `__abdicate()` (external)



Let the guardian abdicate from its priviledged rights


### `getGovernanceStrategy() → address` (external)



Getter of the current GovernanceStrategy address


### `getVotingDelay() → uint256` (external)



Getter of the current Voting Delay (delay before a created proposal can be voted on)
Different from the voting duration


### `isExecutorAuthorized(address executor) → bool` (external)



Returns whether an address is an authorized executor


### `getGuardian() → address` (external)



Getter the address of the guardian, that can mainly cancel proposals


### `getProposalsCount() → uint256` (external)



Getter of the proposal count (the current number of proposals ever created)


### `getProposalById(uint256 proposalId) → struct IAaveGovernanceV2.ProposalWithoutVotes` (external)



Getter of a proposal by id


### `getVoteOnProposal(uint256 proposalId, address voter) → struct IAaveGovernanceV2.Vote` (external)



Getter of the Vote of a voter about a proposal
Note: Vote is a struct: ({bool support, uint248 votingPower})


### `getProposalState(uint256 proposalId) → enum IAaveGovernanceV2.ProposalState` (external)



Get the current state of a proposal



### `ProposalCreated(uint256 id, address creator, contract IExecutorWithTimelock executor, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, bool[] withDelegatecalls, uint256 startBlock, uint256 endBlock, address strategy, bytes32 ipfsHash)`



emitted when a new proposal is created


### `ProposalCanceled(uint256 id)`



emitted when a proposal is canceled


### `ProposalQueued(uint256 id, uint256 executionTime, address initiatorQueueing)`



emitted when a proposal is queued


### `ProposalExecuted(uint256 id, address initiatorExecution)`



emitted when a proposal is executed


### `VoteEmitted(uint256 id, address voter, bool support, uint256 votingPower)`



emitted when a vote is registered


### `GovernanceStrategyChanged(address newStrategy, address initiatorChange)`





### `VotingDelayChanged(uint256 newVotingDelay, address initiatorChange)`





### `ExecutorAuthorized(address executor)`





### `ExecutorUnauthorized(address executor)`






### `Vote`


bool support


uint248 votingPower


### `Proposal`


uint256 id


address creator


contract IExecutorWithTimelock executor


address[] targets


uint256[] values


string[] signatures


bytes[] calldatas


bool[] withDelegatecalls


uint256 startBlock


uint256 endBlock


uint256 executionTime


uint256 forVotes


uint256 againstVotes


bool executed


bool canceled


address strategy


bytes32 ipfsHash


mapping(address => struct IAaveGovernanceV2.Vote) votes


### `ProposalWithoutVotes`


uint256 id


address creator


contract IExecutorWithTimelock executor


address[] targets


uint256[] values


string[] signatures


bytes[] calldatas


bool[] withDelegatecalls


uint256 startBlock


uint256 endBlock


uint256 executionTime


uint256 forVotes


uint256 againstVotes


bool executed


bool canceled


address strategy


bytes32 ipfsHash



### `ProposalState`


























