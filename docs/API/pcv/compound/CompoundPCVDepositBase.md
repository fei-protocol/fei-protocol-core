## `CompoundPCVDepositBase`






### `constructor(address _core, address _cToken)` (internal)

Compound PCV Deposit constructor




### `withdraw(address to, uint256 amountUnderlying)` (external)

withdraw tokens from the PCV allocation




### `balance() → uint256` (public)

returns total balance of PCV in the Deposit excluding the FEI


returns stale values from Compound if the market hasn't been updated

### `_transferUnderlying(address to, uint256 amount)` (internal)








