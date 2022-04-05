## `LinearTimelockedDelegator`

allows the timelocked tokens to be delegated by the beneficiary while locked




### `constructor(address _beneficiary, uint256 _duration, address _token, uint256 _cliff, address _clawbackAdmin, uint256 _startTime)` (public)

LinearTimelockedDelegator constructor




### `acceptBeneficiary()` (public)

accept beneficiary role over timelocked TRIBE


_setBeneficiary internal call checks msg.sender == pendingBeneficiary

### `delegate(address to)` (public)

delegate all held TRIBE to the `to` address






