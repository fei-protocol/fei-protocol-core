## <span id="ILendingPool"></span> `ILendingPool`



- [`deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)`][ILendingPool-deposit-address-uint256-address-uint16-]
- [`withdraw(address asset, uint256 amount, address to)`][ILendingPool-withdraw-address-uint256-address-]
- [`borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)`][ILendingPool-borrow-address-uint256-uint256-uint16-address-]
- [`repay(address asset, uint256 amount, uint256 rateMode, address onBehalfOf)`][ILendingPool-repay-address-uint256-uint256-address-]
- [`swapBorrowRateMode(address asset, uint256 rateMode)`][ILendingPool-swapBorrowRateMode-address-uint256-]
- [`rebalanceStableBorrowRate(address asset, address user)`][ILendingPool-rebalanceStableBorrowRate-address-address-]
- [`setUserUseReserveAsCollateral(address asset, bool useAsCollateral)`][ILendingPool-setUserUseReserveAsCollateral-address-bool-]
- [`liquidationCall(address collateralAsset, address debtAsset, address user, uint256 debtToCover, bool receiveAToken)`][ILendingPool-liquidationCall-address-address-address-uint256-bool-]
- [`flashLoan(address receiverAddress, address[] assets, uint256[] amounts, uint256[] modes, address onBehalfOf, bytes params, uint16 referralCode)`][ILendingPool-flashLoan-address-address---uint256---uint256---address-bytes-uint16-]
- [`getUserAccountData(address user)`][ILendingPool-getUserAccountData-address-]
- [`initReserve(address reserve, address aTokenAddress, address stableDebtAddress, address variableDebtAddress, address interestRateStrategyAddress)`][ILendingPool-initReserve-address-address-address-address-address-]
- [`setReserveInterestRateStrategyAddress(address reserve, address rateStrategyAddress)`][ILendingPool-setReserveInterestRateStrategyAddress-address-address-]
- [`setConfiguration(address reserve, uint256 configuration)`][ILendingPool-setConfiguration-address-uint256-]
- [`getConfiguration(address asset)`][ILendingPool-getConfiguration-address-]
- [`getReserveData(address asset)`][ILendingPool-getReserveData-address-]
- [`getReserveNormalizedIncome(address asset)`][ILendingPool-getReserveNormalizedIncome-address-]
- [`getReserveNormalizedVariableDebt(address asset)`][ILendingPool-getReserveNormalizedVariableDebt-address-]
- [`finalizeTransfer(address asset, address from, address to, uint256 amount, uint256 balanceFromAfter, uint256 balanceToBefore)`][ILendingPool-finalizeTransfer-address-address-address-uint256-uint256-uint256-]
- [`getReservesList()`][ILendingPool-getReservesList--]
- [`getAddressesProvider()`][ILendingPool-getAddressesProvider--]
- [`setPause(bool val)`][ILendingPool-setPause-bool-]
- [`paused()`][ILendingPool-paused--]
- [`Deposit(address reserve, address user, address onBehalfOf, uint256 amount, uint16 referral)`][ILendingPool-Deposit-address-address-address-uint256-uint16-]
- [`Withdraw(address reserve, address user, address to, uint256 amount)`][ILendingPool-Withdraw-address-address-address-uint256-]
- [`Borrow(address reserve, address user, address onBehalfOf, uint256 amount, uint256 borrowRateMode, uint256 borrowRate, uint16 referral)`][ILendingPool-Borrow-address-address-address-uint256-uint256-uint256-uint16-]
- [`Repay(address reserve, address user, address repayer, uint256 amount)`][ILendingPool-Repay-address-address-address-uint256-]
- [`Swap(address reserve, address user, uint256 rateMode)`][ILendingPool-Swap-address-address-uint256-]
- [`ReserveUsedAsCollateralEnabled(address reserve, address user)`][ILendingPool-ReserveUsedAsCollateralEnabled-address-address-]
- [`ReserveUsedAsCollateralDisabled(address reserve, address user)`][ILendingPool-ReserveUsedAsCollateralDisabled-address-address-]
- [`RebalanceStableBorrowRate(address reserve, address user)`][ILendingPool-RebalanceStableBorrowRate-address-address-]
- [`FlashLoan(address target, address initiator, address asset, uint256 amount, uint256 premium, uint16 referralCode)`][ILendingPool-FlashLoan-address-address-address-uint256-uint256-uint16-]
- [`Paused()`][ILendingPool-Paused--]
- [`Unpaused()`][ILendingPool-Unpaused--]
- [`LiquidationCall(address collateralAsset, address debtAsset, address user, uint256 debtToCover, uint256 liquidatedCollateralAmount, address liquidator, bool receiveAToken)`][ILendingPool-LiquidationCall-address-address-address-uint256-uint256-address-bool-]
- [`ReserveDataUpdated(address reserve, uint256 liquidityRate, uint256 stableBorrowRate, uint256 variableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex)`][ILendingPool-ReserveDataUpdated-address-uint256-uint256-uint256-uint256-uint256-]
### <span id="ILendingPool-deposit-address-uint256-address-uint16-"></span> `deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)` (external)

Deposits an `amount` of underlying asset into the reserve, receiving in return overlying aTokens.
- E.g. User deposits 100 USDC and gets in return 100 aUSDC


### <span id="ILendingPool-withdraw-address-uint256-address-"></span> `withdraw(address asset, uint256 amount, address to) → uint256` (external)

Withdraws an `amount` of underlying asset from the reserve, burning the equivalent aTokens owned
E.g. User has 100 aUSDC, calls withdraw() and receives 100 USDC, burning the 100 aUSDC


### <span id="ILendingPool-borrow-address-uint256-uint256-uint16-address-"></span> `borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)` (external)

Allows users to borrow a specific `amount` of the reserve underlying asset, provided that the borrower
already deposited enough collateral, or he was given enough allowance by a credit delegator on the
corresponding debt token (StableDebtToken or VariableDebtToken)
- E.g. User borrows 100 USDC passing as `onBehalfOf` his own address, receiving the 100 USDC in his wallet
  and 100 stable/variable debt tokens, depending on the `interestRateMode`


### <span id="ILendingPool-repay-address-uint256-uint256-address-"></span> `repay(address asset, uint256 amount, uint256 rateMode, address onBehalfOf) → uint256` (external)



### <span id="ILendingPool-swapBorrowRateMode-address-uint256-"></span> `swapBorrowRateMode(address asset, uint256 rateMode)` (external)

Allows a borrower to swap his debt between stable and variable mode, or viceversa


### <span id="ILendingPool-rebalanceStableBorrowRate-address-address-"></span> `rebalanceStableBorrowRate(address asset, address user)` (external)

Rebalances the stable interest rate of a user to the current stable rate defined on the reserve.
- Users can be rebalanced if the following conditions are satisfied:
    1. Usage ratio is above 95%
    2. the current deposit APY is below REBALANCE_UP_THRESHOLD * maxVariableBorrowRate, which means that too much has been
       borrowed at a stable rate and depositors are not earning enough


### <span id="ILendingPool-setUserUseReserveAsCollateral-address-bool-"></span> `setUserUseReserveAsCollateral(address asset, bool useAsCollateral)` (external)

Allows depositors to enable/disable a specific deposited asset as collateral


### <span id="ILendingPool-liquidationCall-address-address-address-uint256-bool-"></span> `liquidationCall(address collateralAsset, address debtAsset, address user, uint256 debtToCover, bool receiveAToken)` (external)

Function to liquidate a non-healthy position collateral-wise, with Health Factor below 1
- The caller (liquidator) covers `debtToCover` amount of debt of the user getting liquidated, and receives
  a proportionally amount of the `collateralAsset` plus a bonus to cover market risk


### <span id="ILendingPool-flashLoan-address-address---uint256---uint256---address-bytes-uint16-"></span> `flashLoan(address receiverAddress, address[] assets, uint256[] amounts, uint256[] modes, address onBehalfOf, bytes params, uint16 referralCode)` (external)

Allows smartcontracts to access the liquidity of the pool within one transaction,
as long as the amount taken plus a fee is returned.
IMPORTANT There are security concerns for developers of flashloan receiver contracts that must be kept into consideration.
For further details please visit https://developers.aave.com


### <span id="ILendingPool-getUserAccountData-address-"></span> `getUserAccountData(address user) → uint256 totalCollateralETH, uint256 totalDebtETH, uint256 availableBorrowsETH, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor` (external)

Returns the user account data across all the reserves


### <span id="ILendingPool-initReserve-address-address-address-address-address-"></span> `initReserve(address reserve, address aTokenAddress, address stableDebtAddress, address variableDebtAddress, address interestRateStrategyAddress)` (external)



### <span id="ILendingPool-setReserveInterestRateStrategyAddress-address-address-"></span> `setReserveInterestRateStrategyAddress(address reserve, address rateStrategyAddress)` (external)



### <span id="ILendingPool-setConfiguration-address-uint256-"></span> `setConfiguration(address reserve, uint256 configuration)` (external)



### <span id="ILendingPool-getConfiguration-address-"></span> `getConfiguration(address asset) → struct DataTypes.ReserveConfigurationMap` (external)

Returns the configuration of the reserve


### <span id="ILendingPool-getReserveData-address-"></span> `getReserveData(address asset) → struct DataTypes.ReserveData` (external)

Returns the state and configuration of the reserve


### <span id="ILendingPool-getReserveNormalizedIncome-address-"></span> `getReserveNormalizedIncome(address asset) → uint256` (external)

Returns the normalized income normalized income of the reserve


### <span id="ILendingPool-getReserveNormalizedVariableDebt-address-"></span> `getReserveNormalizedVariableDebt(address asset) → uint256` (external)

Returns the normalized variable debt per unit of asset


### <span id="ILendingPool-finalizeTransfer-address-address-address-uint256-uint256-uint256-"></span> `finalizeTransfer(address asset, address from, address to, uint256 amount, uint256 balanceFromAfter, uint256 balanceToBefore)` (external)



### <span id="ILendingPool-getReservesList--"></span> `getReservesList() → address[]` (external)



### <span id="ILendingPool-getAddressesProvider--"></span> `getAddressesProvider() → contract ILendingPoolAddressesProvider` (external)



### <span id="ILendingPool-setPause-bool-"></span> `setPause(bool val)` (external)



### <span id="ILendingPool-paused--"></span> `paused() → bool` (external)



### <span id="ILendingPool-Deposit-address-address-address-uint256-uint16-"></span> `Deposit(address reserve, address user, address onBehalfOf, uint256 amount, uint16 referral)`

Emitted on deposit()


### <span id="ILendingPool-Withdraw-address-address-address-uint256-"></span> `Withdraw(address reserve, address user, address to, uint256 amount)`

Emitted on withdraw()


### <span id="ILendingPool-Borrow-address-address-address-uint256-uint256-uint256-uint16-"></span> `Borrow(address reserve, address user, address onBehalfOf, uint256 amount, uint256 borrowRateMode, uint256 borrowRate, uint16 referral)`

Emitted on borrow() and flashLoan() when debt needs to be opened


### <span id="ILendingPool-Repay-address-address-address-uint256-"></span> `Repay(address reserve, address user, address repayer, uint256 amount)`

Emitted on repay()


### <span id="ILendingPool-Swap-address-address-uint256-"></span> `Swap(address reserve, address user, uint256 rateMode)`

Emitted on swapBorrowRateMode()


### <span id="ILendingPool-ReserveUsedAsCollateralEnabled-address-address-"></span> `ReserveUsedAsCollateralEnabled(address reserve, address user)`

Emitted on setUserUseReserveAsCollateral()


### <span id="ILendingPool-ReserveUsedAsCollateralDisabled-address-address-"></span> `ReserveUsedAsCollateralDisabled(address reserve, address user)`

Emitted on setUserUseReserveAsCollateral()


### <span id="ILendingPool-RebalanceStableBorrowRate-address-address-"></span> `RebalanceStableBorrowRate(address reserve, address user)`

Emitted on rebalanceStableBorrowRate()


### <span id="ILendingPool-FlashLoan-address-address-address-uint256-uint256-uint16-"></span> `FlashLoan(address target, address initiator, address asset, uint256 amount, uint256 premium, uint16 referralCode)`

Emitted on flashLoan()


### <span id="ILendingPool-Paused--"></span> `Paused()`

Emitted when the pause is triggered.

### <span id="ILendingPool-Unpaused--"></span> `Unpaused()`

Emitted when the pause is lifted.

### <span id="ILendingPool-LiquidationCall-address-address-address-uint256-uint256-address-bool-"></span> `LiquidationCall(address collateralAsset, address debtAsset, address user, uint256 debtToCover, uint256 liquidatedCollateralAmount, address liquidator, bool receiveAToken)`

Emitted when a borrower is liquidated. This event is emitted by the LendingPool via
LendingPoolCollateral manager using a DELEGATECALL
This allows to have the events in the generated ABI for LendingPool.


### <span id="ILendingPool-ReserveDataUpdated-address-uint256-uint256-uint256-uint256-uint256-"></span> `ReserveDataUpdated(address reserve, uint256 liquidityRate, uint256 stableBorrowRate, uint256 variableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex)`

Emitted when the state of a reserve is updated. NOTE: This event is actually declared
in the ReserveLogic library and emitted in the updateInterestRates() function. Since the function is internal,
the event will actually be fired by the LendingPool contract. The event is therefore replicated here so it
gets added to the LendingPool ABI


