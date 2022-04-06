## <span id="OtcEscrow"></span> `OtcEscrow`



- [`onlyApprovedParties()`][OtcEscrow-onlyApprovedParties--]
- [`constructor(address beneficiary_, address recipient_, address receivedToken_, address sentToken_, uint256 receivedAmount_, uint256 sentAmount_)`][OtcEscrow-constructor-address-address-address-address-uint256-uint256-]
- [`swap()`][OtcEscrow-swap--]
- [`revoke()`][OtcEscrow-revoke--]
- [`revokeReceivedToken()`][OtcEscrow-revokeReceivedToken--]
### <span id="OtcEscrow-onlyApprovedParties--"></span> `onlyApprovedParties()`



### <span id="OtcEscrow-constructor-address-address-address-address-uint256-uint256-"></span> `constructor(address beneficiary_, address recipient_, address receivedToken_, address sentToken_, uint256 receivedAmount_, uint256 sentAmount_)` (public)



### <span id="OtcEscrow-swap--"></span> `swap()` (public)

Atomically trade specified amount of receivedToken for control over sentToken in vesting contract
Either counterparty may execute swap if sufficient token approval is given by recipient

### <span id="OtcEscrow-revoke--"></span> `revoke()` (external)

Return sentToken to Fei Protocol to revoke escrow deal

### <span id="OtcEscrow-revokeReceivedToken--"></span> `revokeReceivedToken()` (external)



