## `NamedStaticPCVDepositWrapper`

a contract to report static PCV data to cover PCV not held with a reliable oracle or on-chain reading 
  @author Fei Protocol

  Returns PCV in USD terms




### `constructor(address _core, struct NamedStaticPCVDepositWrapper.DepositInfo[] newPCVDeposits)` (public)





### `_addDeposit(struct NamedStaticPCVDepositWrapper.DepositInfo newPCVDeposit)` (internal)

helper method to add a PCV deposit



### `_editDeposit(uint256 index, string depositName, uint256 usdAmount, uint256 feiAmount, uint256 underlyingTokenAmount, address underlyingToken)` (internal)

helper method to edit a PCV deposit



### `_removeDeposit(uint256 index)` (internal)

helper method to delete a PCV deposit



### `addDeposit(struct NamedStaticPCVDepositWrapper.DepositInfo newPCVDeposit)` (external)

function to add a deposit



### `bulkAddDeposits(struct NamedStaticPCVDepositWrapper.DepositInfo[] newPCVDeposits)` (external)

function to bulk add deposits



### `removeDeposit(uint256 index)` (external)

function to remove a PCV Deposit



### `editDeposit(uint256 index, uint256 usdAmount, uint256 feiAmount, uint256 underlyingTokenAmount, string depositName, address underlying)` (external)

function to edit an existing deposit



### `numDeposits() → uint256` (public)

returns the current number of PCV deposits



### `resistantBalanceAndFei() → uint256, uint256` (public)

returns the resistant balance and FEI in the deposit



### `balanceReportedIn() → address` (public)

display the related token of the balance reported



### `getAllUnderlying() → address[]` (public)

function to return all of the different tokens deposited into this contract




### `BalanceUpdate(uint256 oldBalance, uint256 newBalance, uint256 oldFEIBalance, uint256 newFEIBalance)`

event to update fei and usd balance



### `DepositRemoved(uint256 index)`

event to remove a deposit



### `DepositAdded(uint256 index, string depositName)`

event to add a new deposit



### `DepositChanged(uint256 index, string depositName)`

event emitted when a deposit is edited




### `DepositInfo`


string depositName


uint256 usdAmount


uint256 feiAmount


uint256 underlyingTokenAmount


address underlyingToken



