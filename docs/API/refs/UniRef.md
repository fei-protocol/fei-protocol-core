## `UniRef`

defines some utilities around interacting with Uniswap


the uniswap pair should be FEI and another asset


### `constructor(address _core, address _pair, address _oracle, address _backupOracle)` (internal)

UniRef constructor




### `setPair(address newPair)` (external)

set the new pair contract




### `getReserves() → uint256 feiReserves, uint256 tokenReserves` (public)

pair reserves with fei listed first



### `_setupPair(address newPair)` (internal)





### `_token() → address` (internal)








