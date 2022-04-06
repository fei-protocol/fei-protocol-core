## <span id="Timelock"></span> `Timelock`



- [`constructor(address admin_, uint256 delay_, uint256 minDelay_)`][Timelock-constructor-address-uint256-uint256-]
- [`receive()`][Timelock-receive--]
- [`setDelay(uint256 delay_)`][Timelock-setDelay-uint256-]
- [`acceptAdmin()`][Timelock-acceptAdmin--]
- [`setPendingAdmin(address pendingAdmin_)`][Timelock-setPendingAdmin-address-]
- [`queueTransaction(address target, uint256 value, string signature, bytes data, uint256 eta)`][Timelock-queueTransaction-address-uint256-string-bytes-uint256-]
- [`cancelTransaction(address target, uint256 value, string signature, bytes data, uint256 eta)`][Timelock-cancelTransaction-address-uint256-string-bytes-uint256-]
- [`_cancelTransaction(address target, uint256 value, string signature, bytes data, uint256 eta)`][Timelock-_cancelTransaction-address-uint256-string-bytes-uint256-]
- [`executeTransaction(address target, uint256 value, string signature, bytes data, uint256 eta)`][Timelock-executeTransaction-address-uint256-string-bytes-uint256-]
- [`getTxHash(address target, uint256 value, string signature, bytes data, uint256 eta)`][Timelock-getTxHash-address-uint256-string-bytes-uint256-]
- [`getBlockTimestamp()`][Timelock-getBlockTimestamp--]
- [`NewAdmin(address newAdmin)`][Timelock-NewAdmin-address-]
- [`NewPendingAdmin(address newPendingAdmin)`][Timelock-NewPendingAdmin-address-]
- [`NewDelay(uint256 newDelay)`][Timelock-NewDelay-uint256-]
- [`CancelTransaction(bytes32 txHash, address target, uint256 value, string signature, bytes data, uint256 eta)`][Timelock-CancelTransaction-bytes32-address-uint256-string-bytes-uint256-]
- [`ExecuteTransaction(bytes32 txHash, address target, uint256 value, string signature, bytes data, uint256 eta)`][Timelock-ExecuteTransaction-bytes32-address-uint256-string-bytes-uint256-]
- [`QueueTransaction(bytes32 txHash, address target, uint256 value, string signature, bytes data, uint256 eta)`][Timelock-QueueTransaction-bytes32-address-uint256-string-bytes-uint256-]
### <span id="Timelock-constructor-address-uint256-uint256-"></span> `constructor(address admin_, uint256 delay_, uint256 minDelay_)` (public)



### <span id="Timelock-receive--"></span> `receive()` (external)



### <span id="Timelock-setDelay-uint256-"></span> `setDelay(uint256 delay_)` (public)



### <span id="Timelock-acceptAdmin--"></span> `acceptAdmin()` (public)



### <span id="Timelock-setPendingAdmin-address-"></span> `setPendingAdmin(address pendingAdmin_)` (public)



### <span id="Timelock-queueTransaction-address-uint256-string-bytes-uint256-"></span> `queueTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) → bytes32` (public)



### <span id="Timelock-cancelTransaction-address-uint256-string-bytes-uint256-"></span> `cancelTransaction(address target, uint256 value, string signature, bytes data, uint256 eta)` (public)



### <span id="Timelock-_cancelTransaction-address-uint256-string-bytes-uint256-"></span> `_cancelTransaction(address target, uint256 value, string signature, bytes data, uint256 eta)` (internal)



### <span id="Timelock-executeTransaction-address-uint256-string-bytes-uint256-"></span> `executeTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) → bytes` (public)



### <span id="Timelock-getTxHash-address-uint256-string-bytes-uint256-"></span> `getTxHash(address target, uint256 value, string signature, bytes data, uint256 eta) → bytes32` (public)



### <span id="Timelock-getBlockTimestamp--"></span> `getBlockTimestamp() → uint256` (internal)



### <span id="Timelock-NewAdmin-address-"></span> `NewAdmin(address newAdmin)`



### <span id="Timelock-NewPendingAdmin-address-"></span> `NewPendingAdmin(address newPendingAdmin)`



### <span id="Timelock-NewDelay-uint256-"></span> `NewDelay(uint256 newDelay)`



### <span id="Timelock-CancelTransaction-bytes32-address-uint256-string-bytes-uint256-"></span> `CancelTransaction(bytes32 txHash, address target, uint256 value, string signature, bytes data, uint256 eta)`



### <span id="Timelock-ExecuteTransaction-bytes32-address-uint256-string-bytes-uint256-"></span> `ExecuteTransaction(bytes32 txHash, address target, uint256 value, string signature, bytes data, uint256 eta)`



### <span id="Timelock-QueueTransaction-bytes32-address-uint256-string-bytes-uint256-"></span> `QueueTransaction(bytes32 txHash, address target, uint256 value, string signature, bytes data, uint256 eta)`



