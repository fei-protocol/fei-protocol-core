## `VoteEscrowTokenManager`






### `constructor(contract IERC20 _liquidToken, contract IVeToken _veToken, uint256 _lockDuration)` (internal)

VoteEscrowTokenManager token Snapshot Delegator PCV Deposit constructor




### `setLockDuration(uint256 newLockDuration)` (external)

Set the amount of time tokens will be vote-escrowed for in lock() calls



### `lock()` (external)

Deposit tokens to get veTokens. Set lock duration to lockDuration.
The only way to withdraw tokens will be to pause this contract
for lockDuration and then call exitLock().



### `exitLock()` (external)

Exit the veToken lock. For this function to be called and not
revert, tokens had to be locked previously, and the contract must have
been paused for lockDuration in order to prevent lock extensions
by calling lock(). This function will recover tokens on the contract,
which can then be moved by calling withdraw() as a PCVController if the
contract is also a PCVDeposit, for instance.



### `_totalTokensManaged() → uint256` (internal)

returns total balance of tokens, vote-escrowed or liquid.




### `Lock(uint256 cummulativeTokensLocked, uint256 lockHorizon)`





### `Unlock(uint256 tokensUnlocked)`







