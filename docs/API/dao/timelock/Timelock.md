## `Timelock`






### `constructor(address admin_, uint256 delay_, uint256 minDelay_)` (public)





### `receive()` (external)





### `setDelay(uint256 delay_)` (public)





### `acceptAdmin()` (public)





### `setPendingAdmin(address pendingAdmin_)` (public)





### `queueTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) → bytes32` (public)





### `cancelTransaction(address target, uint256 value, string signature, bytes data, uint256 eta)` (public)





### `_cancelTransaction(address target, uint256 value, string signature, bytes data, uint256 eta)` (internal)





### `executeTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) → bytes` (public)





### `getTxHash(address target, uint256 value, string signature, bytes data, uint256 eta) → bytes32` (public)





### `getBlockTimestamp() → uint256` (internal)






### `NewAdmin(address newAdmin)`





### `NewPendingAdmin(address newPendingAdmin)`





### `NewDelay(uint256 newDelay)`





### `CancelTransaction(bytes32 txHash, address target, uint256 value, string signature, bytes data, uint256 eta)`





### `ExecuteTransaction(bytes32 txHash, address target, uint256 value, string signature, bytes data, uint256 eta)`





### `QueueTransaction(bytes32 txHash, address target, uint256 value, string signature, bytes data, uint256 eta)`







