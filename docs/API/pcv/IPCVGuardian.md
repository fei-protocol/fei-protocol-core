## `IPCVGuardian`

an interface for defining how the PCVGuardian functions


any implementation of this contract should be granted the roles of Guardian and PCVController in order to work correctly


### `isSafeAddress(address pcvDeposit) → bool` (external)

returns true if the the provided address is a valid destination to withdraw funds to




### `getSafeAddresses() → address[]` (external)

returns all safe addresses



### `setSafeAddress(address pcvDeposit)` (external)

governor-only method to set an address as "safe" to withdraw funds to




### `setSafeAddresses(address[] safeAddresses)` (external)

batch version of setSafeAddress




### `unsetSafeAddress(address pcvDeposit)` (external)

governor-or-guardian-only method to un-set an address as "safe" to withdraw funds to




### `unsetSafeAddresses(address[] safeAddresses)` (external)

batch version of unsetSafeAddresses




### `withdrawToSafeAddress(address pcvDeposit, address safeAddress, uint256 amount, bool pauseAfter, bool depositAfter)` (external)

governor-or-guardian-only method to withdraw funds from a pcv deposit, by calling the withdraw() method on it




### `withdrawETHToSafeAddress(address pcvDeposit, address payable safeAddress, uint256 amount, bool pauseAfter, bool depositAfter)` (external)

governor-or-guardian-only method to withdraw funds from a pcv deposit, by calling the withdraw() method on it




### `withdrawERC20ToSafeAddress(address pcvDeposit, address safeAddress, address token, uint256 amount, bool pauseAfter, bool depositAfter)` (external)

governor-or-guardian-only method to withdraw funds from a pcv deposit, by calling the withdraw() method on it





### `SafeAddressAdded(address safeAddress)`





### `SafeAddressRemoved(address safeAddress)`





### `PCVGuardianWithdrawal(address pcvDeposit, address destination, uint256 amount)`





### `PCVGuardianETHWithdrawal(address pcvDeposit, address destination, uint256 amount)`





### `PCVGuardianERC20Withdrawal(address pcvDeposit, address destination, address token, uint256 amount)`







