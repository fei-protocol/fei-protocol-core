## `SnapshotDelegatorPCVDeposit`






### `constructor(address _core, contract IERC20 _token, bytes32 _spaceId, address _initialDelegate)` (public)

Snapshot Delegator PCV Deposit constructor




### `withdraw(address to, uint256 amountUnderlying)` (external)

withdraw tokens from the PCV allocation




### `deposit()` (external)

no-op



### `balance() → uint256` (public)

returns total balance of PCV in the Deposit



### `balanceReportedIn() → address` (public)

display the related token of the balance reported



### `setSpaceId(bytes32 _spaceId)` (external)

sets the snapshot space ID



### `setDelegate(address newDelegate)` (external)

sets the snapshot delegate



### `clearDelegate()` (external)

clears the delegate from snapshot



### `_delegate(address newDelegate)` (internal)






### `DelegateUpdate(address oldDelegate, address newDelegate)`







