## <span id="IPCVGuardian"></span> `IPCVGuardian`

any implementation of this contract should be granted the roles of Guardian and PCVController in order to work correctly

- [`isSafeAddress(address pcvDeposit)`][IPCVGuardian-isSafeAddress-address-]
- [`getSafeAddresses()`][IPCVGuardian-getSafeAddresses--]
- [`setSafeAddress(address pcvDeposit)`][IPCVGuardian-setSafeAddress-address-]
- [`setSafeAddresses(address[] safeAddresses)`][IPCVGuardian-setSafeAddresses-address---]
- [`unsetSafeAddress(address pcvDeposit)`][IPCVGuardian-unsetSafeAddress-address-]
- [`unsetSafeAddresses(address[] safeAddresses)`][IPCVGuardian-unsetSafeAddresses-address---]
- [`withdrawToSafeAddress(address pcvDeposit, address safeAddress, uint256 amount, bool pauseAfter, bool depositAfter)`][IPCVGuardian-withdrawToSafeAddress-address-address-uint256-bool-bool-]
- [`withdrawETHToSafeAddress(address pcvDeposit, address payable safeAddress, uint256 amount, bool pauseAfter, bool depositAfter)`][IPCVGuardian-withdrawETHToSafeAddress-address-address-payable-uint256-bool-bool-]
- [`withdrawERC20ToSafeAddress(address pcvDeposit, address safeAddress, address token, uint256 amount, bool pauseAfter, bool depositAfter)`][IPCVGuardian-withdrawERC20ToSafeAddress-address-address-address-uint256-bool-bool-]
- [`SafeAddressAdded(address safeAddress)`][IPCVGuardian-SafeAddressAdded-address-]
- [`SafeAddressRemoved(address safeAddress)`][IPCVGuardian-SafeAddressRemoved-address-]
- [`PCVGuardianWithdrawal(address pcvDeposit, address destination, uint256 amount)`][IPCVGuardian-PCVGuardianWithdrawal-address-address-uint256-]
- [`PCVGuardianETHWithdrawal(address pcvDeposit, address destination, uint256 amount)`][IPCVGuardian-PCVGuardianETHWithdrawal-address-address-uint256-]
- [`PCVGuardianERC20Withdrawal(address pcvDeposit, address destination, address token, uint256 amount)`][IPCVGuardian-PCVGuardianERC20Withdrawal-address-address-address-uint256-]
### <span id="IPCVGuardian-isSafeAddress-address-"></span> `isSafeAddress(address pcvDeposit) → bool` (external)



### <span id="IPCVGuardian-getSafeAddresses--"></span> `getSafeAddresses() → address[]` (external)



### <span id="IPCVGuardian-setSafeAddress-address-"></span> `setSafeAddress(address pcvDeposit)` (external)



### <span id="IPCVGuardian-setSafeAddresses-address---"></span> `setSafeAddresses(address[] safeAddresses)` (external)



### <span id="IPCVGuardian-unsetSafeAddress-address-"></span> `unsetSafeAddress(address pcvDeposit)` (external)



### <span id="IPCVGuardian-unsetSafeAddresses-address---"></span> `unsetSafeAddresses(address[] safeAddresses)` (external)



### <span id="IPCVGuardian-withdrawToSafeAddress-address-address-uint256-bool-bool-"></span> `withdrawToSafeAddress(address pcvDeposit, address safeAddress, uint256 amount, bool pauseAfter, bool depositAfter)` (external)



### <span id="IPCVGuardian-withdrawETHToSafeAddress-address-address-payable-uint256-bool-bool-"></span> `withdrawETHToSafeAddress(address pcvDeposit, address payable safeAddress, uint256 amount, bool pauseAfter, bool depositAfter)` (external)



### <span id="IPCVGuardian-withdrawERC20ToSafeAddress-address-address-address-uint256-bool-bool-"></span> `withdrawERC20ToSafeAddress(address pcvDeposit, address safeAddress, address token, uint256 amount, bool pauseAfter, bool depositAfter)` (external)



### <span id="IPCVGuardian-SafeAddressAdded-address-"></span> `SafeAddressAdded(address safeAddress)`



### <span id="IPCVGuardian-SafeAddressRemoved-address-"></span> `SafeAddressRemoved(address safeAddress)`



### <span id="IPCVGuardian-PCVGuardianWithdrawal-address-address-uint256-"></span> `PCVGuardianWithdrawal(address pcvDeposit, address destination, uint256 amount)`



### <span id="IPCVGuardian-PCVGuardianETHWithdrawal-address-address-uint256-"></span> `PCVGuardianETHWithdrawal(address pcvDeposit, address destination, uint256 amount)`



### <span id="IPCVGuardian-PCVGuardianERC20Withdrawal-address-address-address-uint256-"></span> `PCVGuardianERC20Withdrawal(address pcvDeposit, address destination, address token, uint256 amount)`



