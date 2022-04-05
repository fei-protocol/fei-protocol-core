## <span id="QuadtraticTimelockedSubdelegator"></span> `QuadtraticTimelockedSubdelegator`



- [`balanceCheck()`][TokenTimelock-balanceCheck--]
- [`onlyBeneficiary()`][TokenTimelock-onlyBeneficiary--]
- [`duringTime()`][Timed-duringTime--]
- [`afterTime()`][Timed-afterTime--]
- [`constructor(address _beneficiary, uint256 _duration, address _tribe, uint256 _cliff, uint256 _startTime)`][QuadtraticTimelockedSubdelegator-constructor-address-uint256-address-uint256-uint256-]
- [`delegate(address delegatee, uint256 amount)`][QuadtraticTimelockedSubdelegator-delegate-address-uint256-]
- [`undelegate(address delegatee)`][QuadtraticTimelockedSubdelegator-undelegate-address-]
- [`totalToken()`][QuadtraticTimelockedSubdelegator-totalToken--]
- [`acceptBeneficiary()`][QuadtraticTimelockedSubdelegator-acceptBeneficiary--]
- [`_tribeBalance()`][QuadtraticTimelockedSubdelegator-_tribeBalance--]
- [`_proportionAvailable(uint256 initialBalance, uint256 elapsed, uint256 duration)`][QuadraticTokenTimelock-_proportionAvailable-uint256-uint256-uint256-]
- [`release(address to, uint256 amount)`][TokenTimelock-release-address-uint256-]
- [`releaseMax(address to)`][TokenTimelock-releaseMax-address-]
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
- [`delegateContract(address delegatee)`][ITimelockedDelegator-delegateContract-address-]
- [`delegateAmount(address delegatee)`][ITimelockedDelegator-delegateAmount-address-]
- [`totalDelegated()`][ITimelockedDelegator-totalDelegated--]
- [`tribe()`][ITimelockedDelegator-tribe--]
- [`DurationUpdate(uint256 oldDuration, uint256 newDuration)`][Timed-DurationUpdate-uint256-uint256-]
- [`TimerReset(uint256 startTime)`][Timed-TimerReset-uint256-]
- [`Release(address _beneficiary, address _recipient, uint256 _amount)`][ITokenTimelock-Release-address-address-uint256-]
- [`BeneficiaryUpdate(address _beneficiary)`][ITokenTimelock-BeneficiaryUpdate-address-]
- [`PendingBeneficiaryUpdate(address _pendingBeneficiary)`][ITokenTimelock-PendingBeneficiaryUpdate-address-]
- [`Delegate(address _delegatee, uint256 _amount)`][ITimelockedDelegator-Delegate-address-uint256-]
- [`Undelegate(address _delegatee, uint256 _amount)`][ITimelockedDelegator-Undelegate-address-uint256-]
### <span id="QuadtraticTimelockedSubdelegator-constructor-address-uint256-address-uint256-uint256-"></span> `constructor(address _beneficiary, uint256 _duration, address _tribe, uint256 _cliff, uint256 _startTime)` (public)

clawback admin needs to be 0 because clawbacks can be bricked by beneficiary

### <span id="QuadtraticTimelockedSubdelegator-delegate-address-uint256-"></span> `delegate(address delegatee, uint256 amount)` (public)



### <span id="QuadtraticTimelockedSubdelegator-undelegate-address-"></span> `undelegate(address delegatee) → uint256` (public)



### <span id="QuadtraticTimelockedSubdelegator-totalToken--"></span> `totalToken() → uint256` (public)

used by LinearTokenTimelock to determine the released amount

### <span id="QuadtraticTimelockedSubdelegator-acceptBeneficiary--"></span> `acceptBeneficiary()` (public)



### <span id="QuadtraticTimelockedSubdelegator-_tribeBalance--"></span> `_tribeBalance() → uint256` (internal)



