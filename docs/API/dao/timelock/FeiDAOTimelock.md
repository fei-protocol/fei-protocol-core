## `FeiDAOTimelock`






### `constructor(address core_, address admin_, uint256 delay_, uint256 minDelay_)` (public)





### `queueTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) → bytes32` (public)

queue a transaction, with pausability



### `vetoTransactions(address[] targets, uint256[] values, string[] signatures, bytes[] datas, uint256[] etas)` (public)

veto a group of transactions



### `executeTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) → bytes` (public)

execute a transaction, with pausability



### `governorSetPendingAdmin(address newAdmin)` (public)

allow a governor to set a new pending timelock admin



### `rollback()` (external)

one-time option to roll back the Timelock to old timelock


guardian-only, and expires after the deadline. This function is here as a fallback in case something goes wrong.




