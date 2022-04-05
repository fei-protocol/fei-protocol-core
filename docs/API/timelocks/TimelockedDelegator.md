## `TimelockedDelegator`

allows the timelocked TRIBE to be delegated by the beneficiary while locked




### `constructor(address _tribe, address _beneficiary, uint256 _duration)` (public)

Delegatee constructor




### `delegate(address delegatee, uint256 amount)` (public)

delegate locked TRIBE to a delegatee




### `undelegate(address delegatee) → uint256` (public)

return delegated TRIBE to the timelock




### `totalToken() → uint256` (public)

calculate total TRIBE held plus delegated


used by LinearTokenTimelock to determine the released amount

### `acceptBeneficiary()` (public)

accept beneficiary role over timelocked TRIBE. Delegates all held (non-subdelegated) tribe to beneficiary



### `_tribeBalance() → uint256` (internal)








