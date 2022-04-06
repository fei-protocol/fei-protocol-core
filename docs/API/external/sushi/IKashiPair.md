## <span id="IKashiPair"></span> `IKashiPair`



- [`DOMAIN_SEPARATOR()`][IKashiPair-DOMAIN_SEPARATOR--]
- [`accrue()`][IKashiPair-accrue--]
- [`accrueInfo()`][IKashiPair-accrueInfo--]
- [`addAsset(address to, bool skim, uint256 share)`][IKashiPair-addAsset-address-bool-uint256-]
- [`addCollateral(address to, bool skim, uint256 share)`][IKashiPair-addCollateral-address-bool-uint256-]
- [`allowance(address, address)`][IKashiPair-allowance-address-address-]
- [`approve(address spender, uint256 amount)`][IKashiPair-approve-address-uint256-]
- [`asset()`][IKashiPair-asset--]
- [`balanceOf(address)`][IKashiPair-balanceOf-address-]
- [`borrow(address to, uint256 amount)`][IKashiPair-borrow-address-uint256-]
- [`claimOwnership()`][IKashiPair-claimOwnership--]
- [`collateral()`][IKashiPair-collateral--]
- [`cook(uint8[] actions, uint256[] values, bytes[] datas)`][IKashiPair-cook-uint8---uint256---bytes---]
- [`decimals()`][IKashiPair-decimals--]
- [`exchangeRate()`][IKashiPair-exchangeRate--]
- [`feeTo()`][IKashiPair-feeTo--]
- [`init(bytes data)`][IKashiPair-init-bytes-]
- [`isSolvent(address user, bool open)`][IKashiPair-isSolvent-address-bool-]
- [`masterContract()`][IKashiPair-masterContract--]
- [`name()`][IKashiPair-name--]
- [`nonces(address)`][IKashiPair-nonces-address-]
- [`oracleData()`][IKashiPair-oracleData--]
- [`owner()`][IKashiPair-owner--]
- [`pendingOwner()`][IKashiPair-pendingOwner--]
- [`permit(address owner_, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)`][IKashiPair-permit-address-address-uint256-uint256-uint8-bytes32-bytes32-]
- [`removeAsset(address to, uint256 fraction)`][IKashiPair-removeAsset-address-uint256-]
- [`removeCollateral(address to, uint256 share)`][IKashiPair-removeCollateral-address-uint256-]
- [`repay(address to, bool skim, uint256 part)`][IKashiPair-repay-address-bool-uint256-]
- [`setFeeTo(address newFeeTo)`][IKashiPair-setFeeTo-address-]
- [`symbol()`][IKashiPair-symbol--]
- [`totalAsset()`][IKashiPair-totalAsset--]
- [`totalBorrow()`][IKashiPair-totalBorrow--]
- [`totalCollateralShare()`][IKashiPair-totalCollateralShare--]
- [`totalSupply()`][IKashiPair-totalSupply--]
- [`transfer(address to, uint256 amount)`][IKashiPair-transfer-address-uint256-]
- [`transferFrom(address from, address to, uint256 amount)`][IKashiPair-transferFrom-address-address-uint256-]
- [`transferOwnership(address newOwner, bool direct, bool renounce)`][IKashiPair-transferOwnership-address-bool-bool-]
- [`updateExchangeRate()`][IKashiPair-updateExchangeRate--]
- [`userBorrowPart(address)`][IKashiPair-userBorrowPart-address-]
- [`userCollateralShare(address)`][IKashiPair-userCollateralShare-address-]
- [`withdrawFees()`][IKashiPair-withdrawFees--]
- [`Approval(address _owner, address _spender, uint256 _value)`][IKashiPair-Approval-address-address-uint256-]
- [`LogAccrue(uint256 accruedAmount, uint256 feeFraction, uint64 rate, uint256 utilization)`][IKashiPair-LogAccrue-uint256-uint256-uint64-uint256-]
- [`LogAddAsset(address from, address to, uint256 share, uint256 fraction)`][IKashiPair-LogAddAsset-address-address-uint256-uint256-]
- [`LogAddCollateral(address from, address to, uint256 share)`][IKashiPair-LogAddCollateral-address-address-uint256-]
- [`LogBorrow(address from, address to, uint256 amount, uint256 part)`][IKashiPair-LogBorrow-address-address-uint256-uint256-]
- [`LogExchangeRate(uint256 rate)`][IKashiPair-LogExchangeRate-uint256-]
- [`LogFeeTo(address newFeeTo)`][IKashiPair-LogFeeTo-address-]
- [`LogRemoveAsset(address from, address to, uint256 share, uint256 fraction)`][IKashiPair-LogRemoveAsset-address-address-uint256-uint256-]
- [`LogRemoveCollateral(address from, address to, uint256 share)`][IKashiPair-LogRemoveCollateral-address-address-uint256-]
- [`LogRepay(address from, address to, uint256 amount, uint256 part)`][IKashiPair-LogRepay-address-address-uint256-uint256-]
- [`LogWithdrawFees(address feeTo, uint256 feesEarnedFraction)`][IKashiPair-LogWithdrawFees-address-uint256-]
- [`OwnershipTransferred(address previousOwner, address newOwner)`][IKashiPair-OwnershipTransferred-address-address-]
- [`Transfer(address _from, address _to, uint256 _value)`][IKashiPair-Transfer-address-address-uint256-]
### <span id="IKashiPair-DOMAIN_SEPARATOR--"></span> `DOMAIN_SEPARATOR() → bytes32` (external)



### <span id="IKashiPair-accrue--"></span> `accrue()` (external)



### <span id="IKashiPair-accrueInfo--"></span> `accrueInfo() → uint64 interestPerSecond, uint64 lastBlockAccrued, uint128 feesEarnedFraction` (external)



### <span id="IKashiPair-addAsset-address-bool-uint256-"></span> `addAsset(address to, bool skim, uint256 share) → uint256 fraction` (external)



### <span id="IKashiPair-addCollateral-address-bool-uint256-"></span> `addCollateral(address to, bool skim, uint256 share)` (external)



### <span id="IKashiPair-allowance-address-address-"></span> `allowance(address, address) → uint256` (external)



### <span id="IKashiPair-approve-address-uint256-"></span> `approve(address spender, uint256 amount) → bool` (external)



### <span id="IKashiPair-asset--"></span> `asset() → contract IERC20` (external)



### <span id="IKashiPair-balanceOf-address-"></span> `balanceOf(address) → uint256` (external)



### <span id="IKashiPair-borrow-address-uint256-"></span> `borrow(address to, uint256 amount) → uint256 part, uint256 share` (external)



### <span id="IKashiPair-claimOwnership--"></span> `claimOwnership()` (external)



### <span id="IKashiPair-collateral--"></span> `collateral() → contract IERC20` (external)



### <span id="IKashiPair-cook-uint8---uint256---bytes---"></span> `cook(uint8[] actions, uint256[] values, bytes[] datas) → uint256 value1, uint256 value2` (external)



### <span id="IKashiPair-decimals--"></span> `decimals() → uint8` (external)



### <span id="IKashiPair-exchangeRate--"></span> `exchangeRate() → uint256` (external)



### <span id="IKashiPair-feeTo--"></span> `feeTo() → address` (external)



### <span id="IKashiPair-init-bytes-"></span> `init(bytes data)` (external)



### <span id="IKashiPair-isSolvent-address-bool-"></span> `isSolvent(address user, bool open) → bool` (external)



### <span id="IKashiPair-masterContract--"></span> `masterContract() → address` (external)



### <span id="IKashiPair-name--"></span> `name() → string` (external)



### <span id="IKashiPair-nonces-address-"></span> `nonces(address) → uint256` (external)



### <span id="IKashiPair-oracleData--"></span> `oracleData() → bytes` (external)



### <span id="IKashiPair-owner--"></span> `owner() → address` (external)



### <span id="IKashiPair-pendingOwner--"></span> `pendingOwner() → address` (external)



### <span id="IKashiPair-permit-address-address-uint256-uint256-uint8-bytes32-bytes32-"></span> `permit(address owner_, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)` (external)



### <span id="IKashiPair-removeAsset-address-uint256-"></span> `removeAsset(address to, uint256 fraction) → uint256 share` (external)



### <span id="IKashiPair-removeCollateral-address-uint256-"></span> `removeCollateral(address to, uint256 share)` (external)



### <span id="IKashiPair-repay-address-bool-uint256-"></span> `repay(address to, bool skim, uint256 part) → uint256 amount` (external)



### <span id="IKashiPair-setFeeTo-address-"></span> `setFeeTo(address newFeeTo)` (external)



### <span id="IKashiPair-symbol--"></span> `symbol() → string` (external)



### <span id="IKashiPair-totalAsset--"></span> `totalAsset() → uint128 elastic, uint128 base` (external)



### <span id="IKashiPair-totalBorrow--"></span> `totalBorrow() → uint128 elastic, uint128 base` (external)



### <span id="IKashiPair-totalCollateralShare--"></span> `totalCollateralShare() → uint256` (external)



### <span id="IKashiPair-totalSupply--"></span> `totalSupply() → uint256` (external)



### <span id="IKashiPair-transfer-address-uint256-"></span> `transfer(address to, uint256 amount) → bool` (external)



### <span id="IKashiPair-transferFrom-address-address-uint256-"></span> `transferFrom(address from, address to, uint256 amount) → bool` (external)



### <span id="IKashiPair-transferOwnership-address-bool-bool-"></span> `transferOwnership(address newOwner, bool direct, bool renounce)` (external)



### <span id="IKashiPair-updateExchangeRate--"></span> `updateExchangeRate() → bool updated, uint256 rate` (external)



### <span id="IKashiPair-userBorrowPart-address-"></span> `userBorrowPart(address) → uint256` (external)



### <span id="IKashiPair-userCollateralShare-address-"></span> `userCollateralShare(address) → uint256` (external)



### <span id="IKashiPair-withdrawFees--"></span> `withdrawFees()` (external)



### <span id="IKashiPair-Approval-address-address-uint256-"></span> `Approval(address _owner, address _spender, uint256 _value)`



### <span id="IKashiPair-LogAccrue-uint256-uint256-uint64-uint256-"></span> `LogAccrue(uint256 accruedAmount, uint256 feeFraction, uint64 rate, uint256 utilization)`



### <span id="IKashiPair-LogAddAsset-address-address-uint256-uint256-"></span> `LogAddAsset(address from, address to, uint256 share, uint256 fraction)`



### <span id="IKashiPair-LogAddCollateral-address-address-uint256-"></span> `LogAddCollateral(address from, address to, uint256 share)`



### <span id="IKashiPair-LogBorrow-address-address-uint256-uint256-"></span> `LogBorrow(address from, address to, uint256 amount, uint256 part)`



### <span id="IKashiPair-LogExchangeRate-uint256-"></span> `LogExchangeRate(uint256 rate)`



### <span id="IKashiPair-LogFeeTo-address-"></span> `LogFeeTo(address newFeeTo)`



### <span id="IKashiPair-LogRemoveAsset-address-address-uint256-uint256-"></span> `LogRemoveAsset(address from, address to, uint256 share, uint256 fraction)`



### <span id="IKashiPair-LogRemoveCollateral-address-address-uint256-"></span> `LogRemoveCollateral(address from, address to, uint256 share)`



### <span id="IKashiPair-LogRepay-address-address-uint256-uint256-"></span> `LogRepay(address from, address to, uint256 amount, uint256 part)`



### <span id="IKashiPair-LogWithdrawFees-address-uint256-"></span> `LogWithdrawFees(address feeTo, uint256 feesEarnedFraction)`



### <span id="IKashiPair-OwnershipTransferred-address-address-"></span> `OwnershipTransferred(address previousOwner, address newOwner)`



### <span id="IKashiPair-Transfer-address-address-uint256-"></span> `Transfer(address _from, address _to, uint256 _value)`



