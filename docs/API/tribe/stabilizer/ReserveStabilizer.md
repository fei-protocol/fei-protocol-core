## `ReserveStabilizer`






### `constructor(address _core, address _oracle, address _backupOracle, contract IERC20 _token, uint256 _usdPerFeiBasisPoints)` (public)

ERC20 Reserve Stabilizer constructor




### `exchangeFei(uint256 feiAmount) → uint256 amountOut` (public)

exchange FEI for tokens from the reserves




### `getAmountOut(uint256 amountFeiIn) → uint256` (public)

returns the amount out of tokens from the reserves for a given amount of FEI




### `withdraw(address to, uint256 amountOut)` (external)

withdraw tokens from the reserves




### `deposit()` (external)

new PCV deposited to the stabilizer


no-op because the token transfer already happened

### `balance() → uint256` (public)

returns the amount of the held ERC-20



### `balanceReportedIn() → address` (public)

display the related token of the balance reported



### `setUsdPerFeiRate(uint256 newUsdPerFeiBasisPoints)` (external)

sets the USD per FEI exchange rate rate




### `_transfer(address to, uint256 amount)` (internal)








