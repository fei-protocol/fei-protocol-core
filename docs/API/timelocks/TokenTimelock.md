## <span id="TokenTimelock"></span> `TokenTimelock`



- [`balanceCheck()`][TokenTimelock-balanceCheck--]
- [`onlyBeneficiary()`][TokenTimelock-onlyBeneficiary--]
- [`duringTime()`][Timed-duringTime--]
- [`afterTime()`][Timed-afterTime--]
- [`constructor(address _beneficiary, uint256 _duration, uint256 _cliffSeconds, address _lockedToken, address _clawbackAdmin)`][TokenTimelock-constructor-address-uint256-uint256-address-address-]
- [`release(address to, uint256 amount)`][TokenTimelock-release-address-uint256-]
- [`releaseMax(address to)`][TokenTimelock-releaseMax-address-]
- [`totalToken()`][TokenTimelock-totalToken--]
- [`alreadyReleasedAmount()`][TokenTimelock-alreadyReleasedAmount--]
- [`availableForRelease()`][TokenTimelock-availableForRelease--]
- [`setPendingBeneficiary(address _pendingBeneficiary)`][TokenTimelock-setPendingBeneficiary-address-]
- [`acceptBeneficiary()`][TokenTimelock-acceptBeneficiary--]
- [`clawback()`][TokenTimelock-clawback--]
- [`passedCliff()`][TokenTimelock-passedCliff--]
- [`_proportionAvailable(uint256 initialBalance, uint256 elapsed, uint256 duration)`][TokenTimelock-_proportionAvailable-uint256-uint256-uint256-]
- [`_setBeneficiary(address newBeneficiary)`][TokenTimelock-_setBeneficiary-address-]
- [`_setLockedToken(address tokenAddress)`][TokenTimelock-_setLockedToken-address-]
- [`_release(address to, uint256 amount)`][TokenTimelock-_release-address-uint256-]
- [`isTimeEnded()`][Timed-isTimeEnded--]
- [`remainingTime()`][Timed-remainingTime--]
- [`timeSinceStart()`][Timed-timeSinceStart--]
- [`isTimeStarted()`][Timed-isTimeStarted--]
- [`_initTimed()`][Timed-_initTimed--]
- [`_setDuration(uint256 newDuration)`][Timed-_setDuration-uint256-]
- [`lockedToken()`][ITokenTimelock-lockedToken--]
- [`beneficiary()`][ITokenTimelock-beneficiary--]
- [`pendingBeneficiary()`][ITokenTimelock-pendingBeneficiary--]
- [`initialBalance()`][ITokenTimelock-initialBalance--]
- [`DurationUpdate(uint256 oldDuration, uint256 newDuration)`][Timed-DurationUpdate-uint256-uint256-]
- [`TimerReset(uint256 startTime)`][Timed-TimerReset-uint256-]
- [`Release(address _beneficiary, address _recipient, uint256 _amount)`][ITokenTimelock-Release-address-address-uint256-]
- [`BeneficiaryUpdate(address _beneficiary)`][ITokenTimelock-BeneficiaryUpdate-address-]
- [`PendingBeneficiaryUpdate(address _pendingBeneficiary)`][ITokenTimelock-PendingBeneficiaryUpdate-address-]
### <span id="TokenTimelock-balanceCheck--"></span> `balanceCheck()`



### <span id="TokenTimelock-onlyBeneficiary--"></span> `onlyBeneficiary()`



### <span id="TokenTimelock-constructor-address-uint256-uint256-address-address-"></span> `constructor(address _beneficiary, uint256 _duration, uint256 _cliffSeconds, address _lockedToken, address _clawbackAdmin)` (internal)



### <span id="TokenTimelock-release-address-uint256-"></span> `release(address to, uint256 amount)` (external)



### <span id="TokenTimelock-releaseMax-address-"></span> `releaseMax(address to)` (external)



### <span id="TokenTimelock-totalToken--"></span> `totalToken() → uint256` (public)



### <span id="TokenTimelock-alreadyReleasedAmount--"></span> `alreadyReleasedAmount() → uint256` (public)



### <span id="TokenTimelock-availableForRelease--"></span> `availableForRelease() → uint256` (public)



### <span id="TokenTimelock-setPendingBeneficiary-address-"></span> `setPendingBeneficiary(address _pendingBeneficiary)` (public)



### <span id="TokenTimelock-acceptBeneficiary--"></span> `acceptBeneficiary()` (public)



### <span id="TokenTimelock-clawback--"></span> `clawback()` (public)



### <span id="TokenTimelock-passedCliff--"></span> `passedCliff() → bool` (public)



### <span id="TokenTimelock-_proportionAvailable-uint256-uint256-uint256-"></span> `_proportionAvailable(uint256 initialBalance, uint256 elapsed, uint256 duration) → uint256` (internal)



### <span id="TokenTimelock-_setBeneficiary-address-"></span> `_setBeneficiary(address newBeneficiary)` (internal)



### <span id="TokenTimelock-_setLockedToken-address-"></span> `_setLockedToken(address tokenAddress)` (internal)



### <span id="TokenTimelock-_release-address-uint256-"></span> `_release(address to, uint256 amount)` (internal)



