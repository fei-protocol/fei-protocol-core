## `OZGovernorVoter`






### `propose(contract IOZGovernor governor, address[] targets, uint256[] values, bytes[] calldatas, string description) → uint256` (external)

propose a new proposal on the target governor.



### `castVote(contract IOZGovernor governor, uint256 proposalId, uint8 support) → uint256` (external)

cast a vote on a given proposal on the target governor.




### `Proposed(contract IOZGovernor governor, uint256 proposalId)`





### `Voted(contract IOZGovernor governor, uint256 proposalId, uint256 weight, uint8 support)`







