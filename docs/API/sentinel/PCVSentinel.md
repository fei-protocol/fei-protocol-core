## `PCVSentinel`

The PCV Sentinel is a automated extension of the Guardian.
The Guardian can add Guards to the PCV Sentinel. Guards run checks
and provide addresses and calldata for the Sentinel to run, if needed.

the PCV Sentinel should be granted the role Guardian



### `constructor(address _core)` (public)

Creates a PCV Sentinel with no guards




### `isGuard(address guard) → bool` (external)

returns whether or not the given address is a guard




### `allGuards() → address[] all` (external)

returns a list of all guards



### `knight(address guard)` (external)

adds a guard contract to the PCV Sentinel




### `slay(address traitor)` (external)

removes a guard




### `protec(address guard)` (external)

checks the guard and runs its protec actions if needed




### `receive()` (external)



receive() and fallback() have been added and made payable for cases where the contract
needs to be able to receive eth as part of an operation - such as receiving an incentivization
(in eth) from a contract as part of operation. For similar (and not unlikely) edge cases,
the contract also has the capability of sending eth inside when instructed by a guard to do so.

### `fallback()` (external)








