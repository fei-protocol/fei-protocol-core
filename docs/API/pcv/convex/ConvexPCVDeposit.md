## `ConvexPCVDeposit`






### `constructor(address _core, address _curvePool, address _convexBooster, address _convexRewards)` (public)

ConvexPCVDeposit constructor




### `balanceReportedIn() → address` (public)

Curve/Convex deposits report their balance in USD



### `deposit()` (public)

deposit Curve LP tokens on Convex and stake deposit tokens in the
Convex rewards contract.
Note : this call is permissionless, and can be used if LP tokens are
transferred to this contract directly.



### `withdraw(address to, uint256 amountLpTokens)` (public)

unstake LP tokens from Convex Rewards, and withdraw Curve
LP tokens from Convex



### `claimRewards()` (public)

claim CRV & CVX rewards earned by the LP tokens staked on this contract.



### `balance() → uint256` (public)

returns the balance in USD



### `resistantBalanceAndFei() → uint256 resistantBalance, uint256 resistantFei` (public)

returns the resistant balance in USD and FEI held by the contract






