## `VotiumBriber`






### `constructor(address _core, contract IERC20 _token, contract IVotiumBribe _votiumBribe)` (public)

VotiumBriber constructor




### `bribe(bytes32 _proposal, uint256 _choiceIndex)` (public)

Spend tokens on Votium to bribe for a given pool.


the call will revert if Votium has not called initiateProposal with
the _proposal ID, if _choiceIndex is out of range, or of block.timestamp
is after the deadline for bribing (usually 6 hours before Convex snapshot
vote ends).

### `withdrawERC20(address token, address to, uint256 amount)` (external)

withdraw ERC20 from the contract







