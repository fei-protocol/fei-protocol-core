## `IKashiPair`






### `DOMAIN_SEPARATOR() → bytes32` (external)





### `accrue()` (external)





### `accrueInfo() → uint64 interestPerSecond, uint64 lastBlockAccrued, uint128 feesEarnedFraction` (external)





### `addAsset(address to, bool skim, uint256 share) → uint256 fraction` (external)





### `addCollateral(address to, bool skim, uint256 share)` (external)





### `allowance(address, address) → uint256` (external)





### `approve(address spender, uint256 amount) → bool` (external)





### `asset() → contract IERC20` (external)





### `balanceOf(address) → uint256` (external)





### `borrow(address to, uint256 amount) → uint256 part, uint256 share` (external)





### `claimOwnership()` (external)





### `collateral() → contract IERC20` (external)





### `cook(uint8[] actions, uint256[] values, bytes[] datas) → uint256 value1, uint256 value2` (external)





### `decimals() → uint8` (external)





### `exchangeRate() → uint256` (external)





### `feeTo() → address` (external)





### `init(bytes data)` (external)





### `isSolvent(address user, bool open) → bool` (external)





### `masterContract() → address` (external)





### `name() → string` (external)





### `nonces(address) → uint256` (external)





### `oracleData() → bytes` (external)





### `owner() → address` (external)





### `pendingOwner() → address` (external)





### `permit(address owner_, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)` (external)





### `removeAsset(address to, uint256 fraction) → uint256 share` (external)





### `removeCollateral(address to, uint256 share)` (external)





### `repay(address to, bool skim, uint256 part) → uint256 amount` (external)





### `setFeeTo(address newFeeTo)` (external)





### `symbol() → string` (external)





### `totalAsset() → uint128 elastic, uint128 base` (external)





### `totalBorrow() → uint128 elastic, uint128 base` (external)





### `totalCollateralShare() → uint256` (external)





### `totalSupply() → uint256` (external)





### `transfer(address to, uint256 amount) → bool` (external)





### `transferFrom(address from, address to, uint256 amount) → bool` (external)





### `transferOwnership(address newOwner, bool direct, bool renounce)` (external)





### `updateExchangeRate() → bool updated, uint256 rate` (external)





### `userBorrowPart(address) → uint256` (external)





### `userCollateralShare(address) → uint256` (external)





### `withdrawFees()` (external)






### `Approval(address _owner, address _spender, uint256 _value)`





### `LogAccrue(uint256 accruedAmount, uint256 feeFraction, uint64 rate, uint256 utilization)`





### `LogAddAsset(address from, address to, uint256 share, uint256 fraction)`





### `LogAddCollateral(address from, address to, uint256 share)`





### `LogBorrow(address from, address to, uint256 amount, uint256 part)`





### `LogExchangeRate(uint256 rate)`





### `LogFeeTo(address newFeeTo)`





### `LogRemoveAsset(address from, address to, uint256 share, uint256 fraction)`





### `LogRemoveCollateral(address from, address to, uint256 share)`





### `LogRepay(address from, address to, uint256 amount, uint256 part)`





### `LogWithdrawFees(address feeTo, uint256 feesEarnedFraction)`





### `OwnershipTransferred(address previousOwner, address newOwner)`





### `Transfer(address _from, address _to, uint256 _value)`







