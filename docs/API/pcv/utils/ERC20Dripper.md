## `ERC20Dripper`






### `constructor(address _core, address _target, uint256 _frequency, uint256 _amountToDrip, address _token)` (public)

ERC20 PCV Dripper constructor




### `drip()` (external)

drip ERC20 tokens to target



### `withdraw(address to, uint256 amountUnderlying)` (external)

withdraw tokens from the PCV allocation




### `deposit()` (external)

no-op



### `balance() → uint256` (public)

returns total balance of PCV in the Deposit



### `balanceReportedIn() → address` (public)

display the related token of the balance reported




### `Dripped(uint256 amount)`

event emitted when tokens are dripped





