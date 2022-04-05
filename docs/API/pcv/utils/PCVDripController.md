## `PCVDripController`






### `constructor(address _core, contract IPCVDeposit _source, contract IPCVDeposit _target, uint256 _frequency, uint256 _dripAmount, uint256 _incentiveAmount)` (public)

PCV Drip Controller constructor




### `drip()` (external)

drip PCV to target by withdrawing from source



### `setSource(contract IPCVDeposit newSource)` (external)

set the new PCV Deposit source



### `setTarget(contract IPCVDeposit newTarget)` (external)

set the new PCV Deposit target



### `setDripAmount(uint256 newDripAmount)` (external)

set the new drip amount



### `dripEligible() → bool` (public)

checks whether the target balance is less than the drip amount



### `_mintFei(address to, uint256 amountIn)` (internal)








