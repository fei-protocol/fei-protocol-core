## <span id="Tribe"></span> `Tribe`



- [`constructor(address account, address minter_)`][Tribe-constructor-address-address-]
- [`setMinter(address minter_)`][Tribe-setMinter-address-]
- [`mint(address dst, uint256 rawAmount)`][Tribe-mint-address-uint256-]
- [`allowance(address account, address spender)`][Tribe-allowance-address-address-]
- [`approve(address spender, uint256 rawAmount)`][Tribe-approve-address-uint256-]
- [`permit(address owner, address spender, uint256 rawAmount, uint256 deadline, uint8 v, bytes32 r, bytes32 s)`][Tribe-permit-address-address-uint256-uint256-uint8-bytes32-bytes32-]
- [`balanceOf(address account)`][Tribe-balanceOf-address-]
- [`transfer(address dst, uint256 rawAmount)`][Tribe-transfer-address-uint256-]
- [`transferFrom(address src, address dst, uint256 rawAmount)`][Tribe-transferFrom-address-address-uint256-]
- [`delegate(address delegatee)`][Tribe-delegate-address-]
- [`delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s)`][Tribe-delegateBySig-address-uint256-uint256-uint8-bytes32-bytes32-]
- [`getCurrentVotes(address account)`][Tribe-getCurrentVotes-address-]
- [`getPriorVotes(address account, uint256 blockNumber)`][Tribe-getPriorVotes-address-uint256-]
- [`_delegate(address delegator, address delegatee)`][Tribe-_delegate-address-address-]
- [`_transferTokens(address src, address dst, uint96 amount)`][Tribe-_transferTokens-address-address-uint96-]
- [`_moveDelegates(address srcRep, address dstRep, uint96 amount)`][Tribe-_moveDelegates-address-address-uint96-]
- [`_writeCheckpoint(address delegatee, uint32 nCheckpoints, uint96 oldVotes, uint96 newVotes)`][Tribe-_writeCheckpoint-address-uint32-uint96-uint96-]
- [`safe32(uint256 n, string errorMessage)`][Tribe-safe32-uint256-string-]
- [`safe96(uint256 n, string errorMessage)`][Tribe-safe96-uint256-string-]
- [`add96(uint96 a, uint96 b, string errorMessage)`][Tribe-add96-uint96-uint96-string-]
- [`sub96(uint96 a, uint96 b, string errorMessage)`][Tribe-sub96-uint96-uint96-string-]
- [`getChainId()`][Tribe-getChainId--]
- [`MinterChanged(address minter, address newMinter)`][Tribe-MinterChanged-address-address-]
- [`DelegateChanged(address delegator, address fromDelegate, address toDelegate)`][Tribe-DelegateChanged-address-address-address-]
- [`DelegateVotesChanged(address delegate, uint256 previousBalance, uint256 newBalance)`][Tribe-DelegateVotesChanged-address-uint256-uint256-]
- [`Transfer(address from, address to, uint256 amount)`][Tribe-Transfer-address-address-uint256-]
- [`Approval(address owner, address spender, uint256 amount)`][Tribe-Approval-address-address-uint256-]
### <span id="Tribe-constructor-address-address-"></span> `constructor(address account, address minter_)` (public)



### <span id="Tribe-setMinter-address-"></span> `setMinter(address minter_)` (external)



### <span id="Tribe-mint-address-uint256-"></span> `mint(address dst, uint256 rawAmount)` (external)



### <span id="Tribe-allowance-address-address-"></span> `allowance(address account, address spender) → uint256` (external)



### <span id="Tribe-approve-address-uint256-"></span> `approve(address spender, uint256 rawAmount) → bool` (external)

This will overwrite the approval amount for `spender`
 and is subject to issues noted [here](https://eips.ethereum.org/EIPS/eip-20#approve)


### <span id="Tribe-permit-address-address-uint256-uint256-uint8-bytes32-bytes32-"></span> `permit(address owner, address spender, uint256 rawAmount, uint256 deadline, uint8 v, bytes32 r, bytes32 s)` (external)



### <span id="Tribe-balanceOf-address-"></span> `balanceOf(address account) → uint256` (external)



### <span id="Tribe-transfer-address-uint256-"></span> `transfer(address dst, uint256 rawAmount) → bool` (external)



### <span id="Tribe-transferFrom-address-address-uint256-"></span> `transferFrom(address src, address dst, uint256 rawAmount) → bool` (external)



### <span id="Tribe-delegate-address-"></span> `delegate(address delegatee)` (public)



### <span id="Tribe-delegateBySig-address-uint256-uint256-uint8-bytes32-bytes32-"></span> `delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s)` (public)



### <span id="Tribe-getCurrentVotes-address-"></span> `getCurrentVotes(address account) → uint96` (external)



### <span id="Tribe-getPriorVotes-address-uint256-"></span> `getPriorVotes(address account, uint256 blockNumber) → uint96` (public)

Block number must be a finalized block or else this function will revert to prevent misinformation.


### <span id="Tribe-_delegate-address-address-"></span> `_delegate(address delegator, address delegatee)` (internal)



### <span id="Tribe-_transferTokens-address-address-uint96-"></span> `_transferTokens(address src, address dst, uint96 amount)` (internal)



### <span id="Tribe-_moveDelegates-address-address-uint96-"></span> `_moveDelegates(address srcRep, address dstRep, uint96 amount)` (internal)



### <span id="Tribe-_writeCheckpoint-address-uint32-uint96-uint96-"></span> `_writeCheckpoint(address delegatee, uint32 nCheckpoints, uint96 oldVotes, uint96 newVotes)` (internal)



### <span id="Tribe-safe32-uint256-string-"></span> `safe32(uint256 n, string errorMessage) → uint32` (internal)



### <span id="Tribe-safe96-uint256-string-"></span> `safe96(uint256 n, string errorMessage) → uint96` (internal)



### <span id="Tribe-add96-uint96-uint96-string-"></span> `add96(uint96 a, uint96 b, string errorMessage) → uint96` (internal)



### <span id="Tribe-sub96-uint96-uint96-string-"></span> `sub96(uint96 a, uint96 b, string errorMessage) → uint96` (internal)



### <span id="Tribe-getChainId--"></span> `getChainId() → uint256` (internal)



### <span id="Tribe-MinterChanged-address-address-"></span> `MinterChanged(address minter, address newMinter)`



### <span id="Tribe-DelegateChanged-address-address-address-"></span> `DelegateChanged(address delegator, address fromDelegate, address toDelegate)`



### <span id="Tribe-DelegateVotesChanged-address-uint256-uint256-"></span> `DelegateVotesChanged(address delegate, uint256 previousBalance, uint256 newBalance)`



### <span id="Tribe-Transfer-address-address-uint256-"></span> `Transfer(address from, address to, uint256 amount)`



### <span id="Tribe-Approval-address-address-uint256-"></span> `Approval(address owner, address spender, uint256 amount)`



