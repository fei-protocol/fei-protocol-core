## `OtcEscrow`





### `onlyApprovedParties()`






### `constructor(address beneficiary_, address recipient_, address receivedToken_, address sentToken_, uint256 receivedAmount_, uint256 sentAmount_)` (public)





### `swap()` (public)



Atomically trade specified amount of receivedToken for control over sentToken in vesting contract
Either counterparty may execute swap if sufficient token approval is given by recipient

### `revoke()` (external)



Return sentToken to Fei Protocol to revoke escrow deal

### `revokeReceivedToken()` (external)








