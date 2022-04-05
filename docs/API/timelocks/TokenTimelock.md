## `TokenTimelock`





### `balanceCheck()`





### `onlyBeneficiary()`






### `constructor(address _beneficiary, uint256 _duration, uint256 _cliffSeconds, address _lockedToken, address _clawbackAdmin)` (internal)





### `release(address to, uint256 amount)` (external)

releases `amount` unlocked tokens to address `to`



### `releaseMax(address to)` (external)

releases maximum unlocked tokens to address `to`



### `totalToken() → uint256` (public)

the total amount of tokens held by timelock



### `alreadyReleasedAmount() → uint256` (public)

amount of tokens released to beneficiary



### `availableForRelease() → uint256` (public)

amount of held tokens unlocked and available for release



### `setPendingBeneficiary(address _pendingBeneficiary)` (public)

current beneficiary can appoint new beneficiary, which must be accepted



### `acceptBeneficiary()` (public)

pending beneficiary accepts new beneficiary



### `clawback()` (public)





### `passedCliff() → bool` (public)





### `_proportionAvailable(uint256 initialBalance, uint256 elapsed, uint256 duration) → uint256` (internal)





### `_setBeneficiary(address newBeneficiary)` (internal)





### `_setLockedToken(address tokenAddress)` (internal)





### `_release(address to, uint256 amount)` (internal)








