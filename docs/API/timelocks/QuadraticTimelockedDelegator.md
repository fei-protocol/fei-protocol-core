## <span id="QuadraticTimelockedDelegator"></span> `QuadraticTimelockedDelegator`



- [`balanceCheck()`][TokenTimelock-balanceCheck--]
- [`onlyBeneficiary()`][TokenTimelock-onlyBeneficiary--]
- [`duringTime()`][Timed-duringTime--]
- [`afterTime()`][Timed-afterTime--]
- [`constructor(address _token, address _beneficiary, uint256 _duration, uint256 _cliff, address _clawbackAdmin, uint256 _startTime)`][QuadraticTimelockedDelegator-constructor-address-address-uint256-uint256-address-uint256-]
- [`acceptBeneficiary()`][QuadraticTimelockedDelegator-acceptBeneficiary--]
- [`delegate(address to)`][QuadraticTimelockedDelegator-delegate-address-]
- [`_proportionAvailable(uint256 initialBalance, uint256 elapsed, uint256 duration)`][QuadraticTokenTimelock-_proportionAvailable-uint256-uint256-uint256-]
- [`release(address to, uint256 amount)`][TokenTimelock-release-address-uint256-]
- [`releaseMax(address to)`][TokenTimelock-releaseMax-address-]
- [`totalToken()`][TokenTimelock-totalToken--]
- [`alreadyReleasedAmount()`][TokenTimelock-alreadyReleasedAmount--]
- [`availableForRelease()`][TokenTimelock-availableForRelease--]
- [`setPendingBeneficiary(address _pendingBeneficiary)`][TokenTimelock-setPendingBeneficiary-address-]
- [`clawback()`][TokenTimelock-clawback--]
- [`passedCliff()`][TokenTimelock-passedCliff--]
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
### <span id="QuadraticTimelockedDelegator-constructor-address-address-uint256-uint256-address-uint256-"></span> `constructor(address _token, address _beneficiary, uint256 _duration, uint256 _cliff, address _clawbackAdmin, uint256 _startTime)` (public)



### <span id="QuadraticTimelockedDelegator-acceptBeneficiary--"></span> `acceptBeneficiary()` (public)



### <span id="QuadraticTimelockedDelegator-delegate-address-"></span> `delegate(address to)` (public)



