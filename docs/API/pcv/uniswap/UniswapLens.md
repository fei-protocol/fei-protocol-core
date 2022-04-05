## `UniswapLens`

a contract to read tokens & fei out of a contract that reports balance in Uniswap LP tokens.




### `constructor(address _depositAddress, address _core, address _oracle, address _backupOracle)` (public)





### `balance() → uint256` (public)





### `resistantBalanceAndFei() → uint256, uint256` (public)





### `_ratioOwned() → struct Decimal.D256` (internal)

ratio of all pair liquidity owned by the deposit contract



### `liquidityOwned() → uint256` (public)

amount of pair liquidity owned by the deposit contract







