## `BPTLens`

a contract to read manipulation resistant balances from BPTs




### `constructor(address _token, contract IWeightedPool _pool, contract IOracle _reportedOracle, contract IOracle _otherOracle, bool _feiIsReportedIn, bool _feiIsOther)` (public)





### `balance() → uint256` (public)





### `resistantBalanceAndFei() → uint256, uint256` (public)

Calculates the manipulation resistant balances of Balancer pool tokens using the logic described here:
https://docs.gyro.finance/learn/oracles/bpt-oracle
This is robust to price manipulations within the Balancer pool.



### `_getIdealReserves(uint256[] balances, uint256[] prices, uint256[] weights, uint256 i) → uint256 reserves` (internal)








