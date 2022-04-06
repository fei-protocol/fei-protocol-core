## <span id="TimelockInterface"></span> `TimelockInterface`



- [`delay()`][TimelockInterface-delay--]
- [`GRACE_PERIOD()`][TimelockInterface-GRACE_PERIOD--]
- [`acceptAdmin()`][TimelockInterface-acceptAdmin--]
- [`queuedTransactions(bytes32 hash)`][TimelockInterface-queuedTransactions-bytes32-]
- [`queueTransaction(address target, uint256 value, string signature, bytes data, uint256 eta)`][TimelockInterface-queueTransaction-address-uint256-string-bytes-uint256-]
- [`cancelTransaction(address target, uint256 value, string signature, bytes data, uint256 eta)`][TimelockInterface-cancelTransaction-address-uint256-string-bytes-uint256-]
- [`executeTransaction(address target, uint256 value, string signature, bytes data, uint256 eta)`][TimelockInterface-executeTransaction-address-uint256-string-bytes-uint256-]
### <span id="TimelockInterface-delay--"></span> `delay() → uint256` (external)



### <span id="TimelockInterface-GRACE_PERIOD--"></span> `GRACE_PERIOD() → uint256` (external)



### <span id="TimelockInterface-acceptAdmin--"></span> `acceptAdmin()` (external)



### <span id="TimelockInterface-queuedTransactions-bytes32-"></span> `queuedTransactions(bytes32 hash) → bool` (external)



### <span id="TimelockInterface-queueTransaction-address-uint256-string-bytes-uint256-"></span> `queueTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) → bytes32` (external)



### <span id="TimelockInterface-cancelTransaction-address-uint256-string-bytes-uint256-"></span> `cancelTransaction(address target, uint256 value, string signature, bytes data, uint256 eta)` (external)



### <span id="TimelockInterface-executeTransaction-address-uint256-string-bytes-uint256-"></span> `executeTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) → bytes` (external)



