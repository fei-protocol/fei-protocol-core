## `PCVGuardian`






### `constructor(address _core, address[] _safeAddresses)` (public)





### `isSafeAddress(address pcvDeposit) → bool` (public)

returns true if the the provided address is a valid destination to withdraw funds to




### `getSafeAddresses() → address[]` (public)

returns all safe addresses



### `setSafeAddress(address pcvDeposit)` (external)

governor-only method to set an address as "safe" to withdraw funds to




### `setSafeAddresses(address[] _safeAddresses)` (external)

batch version of setSafeAddress




### `unsetSafeAddress(address pcvDeposit)` (external)

governor-or-guardian-only method to un-set an address as "safe" to withdraw funds to




### `unsetSafeAddresses(address[] _safeAddresses)` (external)

batch version of unsetSafeAddresses




### `withdrawToSafeAddress(address pcvDeposit, address safeAddress, uint256 amount, bool pauseAfter, bool depositAfter)` (external)

governor-or-guardian-only method to withdraw funds from a pcv deposit, by calling the withdraw() method on it




### `withdrawETHToSafeAddress(address pcvDeposit, address payable safeAddress, uint256 amount, bool pauseAfter, bool depositAfter)` (external)

governor-or-guardian-only method to withdraw funds from a pcv deposit, by calling the withdraw() method on it




### `withdrawERC20ToSafeAddress(address pcvDeposit, address safeAddress, address token, uint256 amount, bool pauseAfter, bool depositAfter)` (external)

governor-or-guardian-only method to withdraw funds from a pcv deposit, by calling the withdraw() method on it




### `_setSafeAddress(address anAddress)` (internal)





### `_unsetSafeAddress(address anAddress)` (internal)








