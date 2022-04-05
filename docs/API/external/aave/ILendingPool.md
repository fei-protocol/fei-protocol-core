## `ILendingPool`






### `deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)` (external)



Deposits an `amount` of underlying asset into the reserve, receiving in return overlying aTokens.
- E.g. User deposits 100 USDC and gets in return 100 aUSDC


### `withdraw(address asset, uint256 amount, address to) → uint256` (external)



Withdraws an `amount` of underlying asset from the reserve, burning the equivalent aTokens owned
E.g. User has 100 aUSDC, calls withdraw() and receives 100 USDC, burning the 100 aUSDC


### `borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)` (external)



Allows users to borrow a specific `amount` of the reserve underlying asset, provided that the borrower
already deposited enough collateral, or he was given enough allowance by a credit delegator on the
corresponding debt token (StableDebtToken or VariableDebtToken)
- E.g. User borrows 100 USDC passing as `onBehalfOf` his own address, receiving the 100 USDC in his wallet
  and 100 stable/variable debt tokens, depending on the `interestRateMode`


### `repay(address asset, uint256 amount, uint256 rateMode, address onBehalfOf) → uint256` (external)

Repays a borrowed `amount` on a specific reserve, burning the equivalent debt tokens owned
- E.g. User repays 100 USDC, burning 100 variable/stable debt tokens of the `onBehalfOf` address




### `swapBorrowRateMode(address asset, uint256 rateMode)` (external)



Allows a borrower to swap his debt between stable and variable mode, or viceversa


### `rebalanceStableBorrowRate(address asset, address user)` (external)



Rebalances the stable interest rate of a user to the current stable rate defined on the reserve.
- Users can be rebalanced if the following conditions are satisfied:
    1. Usage ratio is above 95%
    2. the current deposit APY is below REBALANCE_UP_THRESHOLD * maxVariableBorrowRate, which means that too much has been
       borrowed at a stable rate and depositors are not earning enough


### `setUserUseReserveAsCollateral(address asset, bool useAsCollateral)` (external)



Allows depositors to enable/disable a specific deposited asset as collateral


### `liquidationCall(address collateralAsset, address debtAsset, address user, uint256 debtToCover, bool receiveAToken)` (external)



Function to liquidate a non-healthy position collateral-wise, with Health Factor below 1
- The caller (liquidator) covers `debtToCover` amount of debt of the user getting liquidated, and receives
  a proportionally amount of the `collateralAsset` plus a bonus to cover market risk


### `flashLoan(address receiverAddress, address[] assets, uint256[] amounts, uint256[] modes, address onBehalfOf, bytes params, uint16 referralCode)` (external)



Allows smartcontracts to access the liquidity of the pool within one transaction,
as long as the amount taken plus a fee is returned.
IMPORTANT There are security concerns for developers of flashloan receiver contracts that must be kept into consideration.
For further details please visit https://developers.aave.com


### `getUserAccountData(address user) → uint256 totalCollateralETH, uint256 totalDebtETH, uint256 availableBorrowsETH, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor` (external)



Returns the user account data across all the reserves


### `initReserve(address reserve, address aTokenAddress, address stableDebtAddress, address variableDebtAddress, address interestRateStrategyAddress)` (external)





### `setReserveInterestRateStrategyAddress(address reserve, address rateStrategyAddress)` (external)





### `setConfiguration(address reserve, uint256 configuration)` (external)





### `getConfiguration(address asset) → struct DataTypes.ReserveConfigurationMap` (external)



Returns the configuration of the reserve


### `getReserveData(address asset) → struct DataTypes.ReserveData` (external)



Returns the state and configuration of the reserve


### `getReserveNormalizedIncome(address asset) → uint256` (external)



Returns the normalized income normalized income of the reserve


### `getReserveNormalizedVariableDebt(address asset) → uint256` (external)



Returns the normalized variable debt per unit of asset


### `finalizeTransfer(address asset, address from, address to, uint256 amount, uint256 balanceFromAfter, uint256 balanceToBefore)` (external)





### `getReservesList() → address[]` (external)





### `getAddressesProvider() → contract ILendingPoolAddressesProvider` (external)





### `setPause(bool val)` (external)





### `paused() → bool` (external)






### `Deposit(address reserve, address user, address onBehalfOf, uint256 amount, uint16 referral)`



Emitted on deposit()


### `Withdraw(address reserve, address user, address to, uint256 amount)`



Emitted on withdraw()


### `Borrow(address reserve, address user, address onBehalfOf, uint256 amount, uint256 borrowRateMode, uint256 borrowRate, uint16 referral)`



Emitted on borrow() and flashLoan() when debt needs to be opened


### `Repay(address reserve, address user, address repayer, uint256 amount)`



Emitted on repay()


### `Swap(address reserve, address user, uint256 rateMode)`



Emitted on swapBorrowRateMode()


### `ReserveUsedAsCollateralEnabled(address reserve, address user)`



Emitted on setUserUseReserveAsCollateral()


### `ReserveUsedAsCollateralDisabled(address reserve, address user)`



Emitted on setUserUseReserveAsCollateral()


### `RebalanceStableBorrowRate(address reserve, address user)`



Emitted on rebalanceStableBorrowRate()


### `FlashLoan(address target, address initiator, address asset, uint256 amount, uint256 premium, uint16 referralCode)`



Emitted on flashLoan()


### `Paused()`



Emitted when the pause is triggered.

### `Unpaused()`



Emitted when the pause is lifted.

### `LiquidationCall(address collateralAsset, address debtAsset, address user, uint256 debtToCover, uint256 liquidatedCollateralAmount, address liquidator, bool receiveAToken)`



Emitted when a borrower is liquidated. This event is emitted by the LendingPool via
LendingPoolCollateral manager using a DELEGATECALL
This allows to have the events in the generated ABI for LendingPool.


### `ReserveDataUpdated(address reserve, uint256 liquidityRate, uint256 stableBorrowRate, uint256 variableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex)`



Emitted when the state of a reserve is updated. NOTE: This event is actually declared
in the ReserveLogic library and emitted in the updateInterestRates() function. Since the function is internal,
the event will actually be fired by the LendingPool contract. The event is therefore replicated here so it
gets added to the LendingPool ABI




