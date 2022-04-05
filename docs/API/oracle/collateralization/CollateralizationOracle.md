## `CollateralizationOracle`

Reads a list of PCVDeposit that report their amount of collateral
        and the amount of protocol-owned FEI they manage, to deduce the
        protocol-wide collateralization ratio.




### `constructor(address _core, address[] _deposits, address[] _tokens, address[] _oracles)` (public)

CollateralizationOracle constructor




### `isTokenInPcv(address token) → bool` (external)

returns true if a token is held in the pcv



### `getTokensInPcv() → address[]` (external)

returns an array of the addresses of tokens held in the pcv.



### `getTokenInPcv(uint256 i) → address` (external)

returns token at index i of the array of PCV tokens



### `getDepositsForToken(address _token) → address[]` (external)

returns an array of the deposits holding a given token.



### `getDepositForToken(address token, uint256 i) → address` (external)

returns the address of deposit at index i of token _token



### `addDeposit(address _deposit)` (external)

Add a PCVDeposit to the list of deposits inspected by the
        collateralization ratio oracle.
        note : this function reverts if the deposit is already in the list.
        note : this function reverts if the deposit's token has no oracle.




### `addDeposits(address[] _deposits)` (external)

adds a list of multiple PCV deposits. See addDeposit.



### `_addDeposits(address[] _deposits)` (internal)





### `_addDeposit(address _deposit)` (internal)





### `removeDeposit(address _deposit)` (external)

Remove a PCVDeposit from the list of deposits inspected by
        the collateralization ratio oracle.
        note : this function reverts if the input deposit is not found.




### `removeDeposits(address[] _deposits)` (external)

removes a list of multiple PCV deposits. See removeDeposit.



### `_removeDeposit(address _deposit)` (internal)





### `swapDeposit(address _oldDeposit, address _newDeposit)` (external)

Swap a PCVDeposit with a new one, for instance when a new version
        of a deposit (holding the same token) is deployed.




### `setOracle(address _token, address _newOracle)` (external)

Set the price feed oracle (in USD) for a given asset.




### `setOracles(address[] _tokens, address[] _oracles)` (public)

adds a list of token oracles. See setOracle.



### `_setOracles(address[] _tokens, address[] _oracles)` (internal)





### `_setOracle(address _token, address _newOracle)` (internal)





### `update()` (external)

update all oracles required for this oracle to work that are not
        paused themselves.



### `isOutdated() → bool` (external)





### `read() → struct Decimal.D256 collateralRatio, bool validityStatus` (public)

Get the current collateralization ratio of the protocol.




### `pcvStats() → uint256 protocolControlledValue, uint256 userCirculatingFei, int256 protocolEquity, bool validityStatus` (public)

returns the Protocol-Controlled Value, User-circulating FEI, and
        Protocol Equity.




### `isOvercollateralized() → bool` (external)

returns true if the protocol is overcollateralized. Overcollateralization
        is defined as the protocol having more assets in its PCV (Protocol
        Controlled Value) than the circulating (user-owned) FEI, i.e.
        a positive Protocol Equity.




### `DepositAdd(address from, address deposit, address token)`





### `DepositRemove(address from, address deposit)`





### `OracleUpdate(address from, address token, address oldOracle, address newOracle)`







