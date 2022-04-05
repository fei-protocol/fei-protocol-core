## `FuseGuardian`






### `constructor(address _core, contract Unitroller _comptroller)` (public)





### `_setMarketSupplyCaps(contract CToken[] cTokens, uint256[] newSupplyCaps)` (external)

Set the given supply caps for the given cToken markets. Supplying that brings total underlying supply to or above supply cap will revert.


Admin or borrowCapGuardian function to set the supply caps. A supply cap of 0 corresponds to unlimited supplying.


### `_setMarketSupplyCapsByUnderlying(address[] underlyings, uint256[] newSupplyCaps)` (external)





### `_setMarketSupplyCapsInternal(contract CToken[] cTokens, uint256[] newSupplyCaps)` (internal)





### `_underlyingToCTokens(address[] underlyings) → contract CToken[]` (internal)





### `_setMarketBorrowCaps(contract CToken[] cTokens, uint256[] newBorrowCaps)` (external)

Set the given borrow caps for the given cToken markets. Borrowing that brings total borrows to or above borrow cap will revert.


Admin or borrowCapGuardian function to set the borrow caps. A borrow cap of 0 corresponds to unlimited borrowing.


### `_setMarketBorrowCapsInternal(contract CToken[] cTokens, uint256[] newBorrowCaps)` (internal)





### `_setMarketBorrowCapsByUnderlying(address[] underlyings, uint256[] newBorrowCaps)` (external)





### `_setBorrowCapGuardian(address newBorrowCapGuardian)` (external)

Admin function to change the Borrow Cap Guardian




### `_setPauseGuardian(address newPauseGuardian) → uint256` (external)

Admin function to change the Pause Guardian




### `_setMintPausedByUnderlying(address underlying, bool state) → bool` (external)





### `_setMintPaused(contract CToken cToken, bool state) → bool` (external)





### `_setMintPausedInternal(contract CToken cToken, bool state) → bool` (internal)





### `_setBorrowPausedByUnderlying(address underlying, bool state) → bool` (external)





### `_setBorrowPausedInternal(contract CToken cToken, bool state) → bool` (internal)





### `_setBorrowPaused(contract CToken cToken, bool state) → bool` (external)





### `_setTransferPaused(bool state) → bool` (external)





### `_setSeizePaused(bool state) → bool` (external)








