## `AavePCVDeposit`






### `constructor(address _core, contract LendingPool _lendingPool, contract IERC20 _token, contract IERC20 _aToken, contract IncentivesController _incentivesController)` (public)

Aave PCV Deposit constructor




### `claimRewards()` (external)

claims Aave rewards from the deposit and transfers to this address



### `deposit()` (external)

deposit buffered aTokens



### `withdraw(address to, uint256 amountUnderlying)` (external)

withdraw tokens from the PCV allocation




### `balance() → uint256` (public)

returns total balance of PCV in the Deposit


aTokens are rebasing, so represent 1:1 on underlying value

### `balanceReportedIn() → address` (public)

display the related token of the balance reported




### `ClaimRewards(address caller, uint256 amount)`







