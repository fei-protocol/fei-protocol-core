## `CurvePCVDepositPlainPool`






### `constructor(address _core, address _curvePool, uint256 _maxSlippageBasisPoints)` (public)

CurvePCVDepositPlainPool constructor




### `balanceReportedIn() → address` (public)

Curve/Convex deposits report their balance in USD



### `deposit()` (public)

deposit tokens into the Curve pool, then stake the LP tokens
on Convex to earn rewards.



### `withdraw(address to, uint256 amountUnderlying)` (public)

Exit the Curve pool by removing liquidity in one token.
If FEI is in the pool, pull FEI out of the pool. If FEI is not in the pool,
exit in the first token of the pool. To exit without chosing a specific
token, and minimize slippage, use exitPool().



### `withdrawOneCoin(uint256 coinIndexInPool, address to, uint256 amountUnderlying)` (public)

Exit the Curve pool by removing liquidity in one token.
Note that this method can cause slippage. To exit without slippage, use
the exitPool() method.



### `exitPool()` (public)

Exit the Curve pool by removing liquidity. The contract
will hold tokens in proportion to what was in the Curve pool at the time
of exit, i.e. if the pool is 20% FRAX 60% FEI 20% alUSD, and the contract
has 10M$ of liquidity, it will exit the pool with 2M FRAX, 6M FEI, 2M alUSD.



### `balance() → uint256` (public)

returns the balance in USD



### `resistantBalanceAndFei() → uint256 resistantBalance, uint256 resistantFei` (public)

returns the resistant balance in USD and FEI held by the contract






