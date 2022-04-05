## `UniswapPCVDeposit`






### `constructor(address _core, address _pair, address _router, address _oracle, address _backupOracle, uint256 _maxBasisPointsFromPegLP)` (public)

Uniswap PCV Deposit constructor




### `receive()` (external)





### `deposit()` (external)

deposit tokens into the PCV allocation



### `withdraw(address to, uint256 amountUnderlying)` (external)

withdraw tokens from the PCV allocation


has rounding errors on amount to withdraw, can differ from the input "amountUnderlying"

### `setMaxBasisPointsFromPegLP(uint256 _maxBasisPointsFromPegLP)` (public)

sets the new slippage parameter for depositing liquidity




### `setPair(address _pair)` (public)

set the new pair contract


also approves the router for the new pair token and underlying token

### `balance() → uint256` (public)

returns total balance of PCV in the Deposit excluding the FEI



### `balanceReportedIn() → address` (public)

display the related token of the balance reported



### `resistantBalanceAndFei() → uint256, uint256` (public)

get the manipulation resistant Other(example ETH) and FEI in the Uniswap pool
        @return number of other token in pool
        @return number of FEI in pool

        Derivation rETH, rFEI = resistant (ideal) ETH and FEI reserves, P = price of ETH in FEI:
        1. rETH * rFEI = k
        2. rETH = k / rFEI
        3. rETH = (k * rETH) / (rFEI * rETH)
        4. rETH ^ 2 = k / P
        5. rETH = sqrt(k / P)

        and rFEI = k / rETH by 1.

        Finally scale the resistant reserves by the ratio owned by the contract



### `liquidityOwned() → uint256` (public)

amount of pair liquidity owned by this contract




### `_removeLiquidity(uint256 liquidity) → uint256` (internal)





### `_addLiquidity(uint256 tokenAmount, uint256 feiAmount)` (internal)





### `_getMinLiquidity(uint256 amount) → uint256` (internal)

used as slippage protection when adding liquidity to the pool



### `_ratioOwned() → struct Decimal.D256` (internal)

ratio of all pair liquidity owned by this contract



### `_approveToken(address _token)` (internal)

approves a token for the router



### `_wrap()` (internal)








