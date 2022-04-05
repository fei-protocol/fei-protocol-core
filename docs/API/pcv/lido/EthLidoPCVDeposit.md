## `EthLidoPCVDeposit`






### `constructor(address _core, address _steth, address _stableswap, uint256 _maximumSlippageBasisPoints)` (public)





### `receive()` (external)





### `deposit()` (external)

deposit ETH held by the contract to get stETH.


everyone can call deposit(), it is not protected by PCVController
rights, because all ETH held by the contract is destined to be
changed to stETH anyway.

### `withdraw(address to, uint256 amountIn)` (external)

withdraw stETH held by the contract to get ETH.
This function with swap stETH held by the contract to ETH, and transfer
it to the target address. Note: the withdraw could
revert if the Curve pool is imbalanced with too many stETH and the amount
of ETH out of the trade is less than the tolerated slippage.




### `balance() → uint256 amount` (public)

Returns the current balance of stETH held by the contract



### `setMaximumSlippage(uint256 _maximumSlippageBasisPoints)` (external)

Sets the maximum slippage vs 1:1 price accepted during withdraw.




### `balanceReportedIn() → address` (public)

display the related token of the balance reported




### `UpdateMaximumSlippage(uint256 maximumSlippageBasisPoints)`







