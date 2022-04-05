## `BalancerPCVDepositWeightedPool`






### `constructor(address _core, address _vault, address _rewards, bytes32 _poolId, uint256 _maximumSlippageBasisPoints, address _token, contract IOracle[] _tokenOracles)` (public)

Balancer PCV Deposit constructor




### `setOracle(address _token, address _newOracle)` (external)

sets the oracle for a token in this deposit



### `balance() → uint256` (public)

returns total balance of PCV in the Deposit, expressed in "token"



### `resistantBalanceAndFei() → uint256 _resistantBalance, uint256 _resistantFei` (public)





### `balanceReportedIn() → address` (public)

display the related token of the balance reported



### `deposit()` (external)





### `withdraw(address to, uint256 amount)` (external)

withdraw tokens from the PCV allocation




### `_readOracles() → uint256[] underlyingPrices` (internal)

read token oracles and revert if one of them is invalid



### `_getBPTPrice(uint256[] underlyingPrices) → uint256 bptPrice` (internal)

Calculates the value of Balancer pool tokens using the logic described here:
https://docs.gyro.finance/learn/oracles/bpt-oracle
This is robust to price manipulations within the Balancer pool.
Courtesy of Gyroscope protocol, used with permission. See the original file here :
https://github.com/gyrostable/core/blob/master/contracts/GyroPriceOracle.sol#L109-L167





### `OracleUpdate(address _sender, address _token, address _oldOracle, address _newOracle)`







