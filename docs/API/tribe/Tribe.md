## `Tribe`






### `constructor(address account, address minter_)` (public)

Construct a new Tribe token




### `setMinter(address minter_)` (external)

Change the minter address




### `mint(address dst, uint256 rawAmount)` (external)

Mint new tokens




### `allowance(address account, address spender) → uint256` (external)

Get the number of tokens `spender` is approved to spend on behalf of `account`




### `approve(address spender, uint256 rawAmount) → bool` (external)

Approve `spender` to transfer up to `amount` from `src`


This will overwrite the approval amount for `spender`
 and is subject to issues noted [here](https://eips.ethereum.org/EIPS/eip-20#approve)


### `permit(address owner, address spender, uint256 rawAmount, uint256 deadline, uint8 v, bytes32 r, bytes32 s)` (external)

Triggers an approval from owner to spends




### `balanceOf(address account) → uint256` (external)

Get the number of tokens held by the `account`




### `transfer(address dst, uint256 rawAmount) → bool` (external)

Transfer `amount` tokens from `msg.sender` to `dst`




### `transferFrom(address src, address dst, uint256 rawAmount) → bool` (external)

Transfer `amount` tokens from `src` to `dst`




### `delegate(address delegatee)` (public)

Delegate votes from `msg.sender` to `delegatee`




### `delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s)` (public)

Delegates votes from signatory to `delegatee`




### `getCurrentVotes(address account) → uint96` (external)

Gets the current votes balance for `account`




### `getPriorVotes(address account, uint256 blockNumber) → uint96` (public)

Determine the prior number of votes for an account as of a block number


Block number must be a finalized block or else this function will revert to prevent misinformation.


### `_delegate(address delegator, address delegatee)` (internal)





### `_transferTokens(address src, address dst, uint96 amount)` (internal)





### `_moveDelegates(address srcRep, address dstRep, uint96 amount)` (internal)





### `_writeCheckpoint(address delegatee, uint32 nCheckpoints, uint96 oldVotes, uint96 newVotes)` (internal)





### `safe32(uint256 n, string errorMessage) → uint32` (internal)





### `safe96(uint256 n, string errorMessage) → uint96` (internal)





### `add96(uint96 a, uint96 b, string errorMessage) → uint96` (internal)





### `sub96(uint96 a, uint96 b, string errorMessage) → uint96` (internal)





### `getChainId() → uint256` (internal)






### `MinterChanged(address minter, address newMinter)`

An event thats emitted when the minter address is changed



### `DelegateChanged(address delegator, address fromDelegate, address toDelegate)`

An event thats emitted when an account changes its delegate



### `DelegateVotesChanged(address delegate, uint256 previousBalance, uint256 newBalance)`

An event thats emitted when a delegate account's vote balance changes



### `Transfer(address from, address to, uint256 amount)`

The standard EIP-20 transfer event



### `Approval(address owner, address spender, uint256 amount)`

The standard EIP-20 approval event




### `Checkpoint`


uint32 fromBlock


uint96 votes



