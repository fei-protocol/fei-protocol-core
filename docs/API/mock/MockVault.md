## `MockVault`






### `constructor(contract IERC20[] tokens, address owner)` (public)





### `setMockDoTransfers(bool flag)` (external)





### `getPool(bytes32 poolId) → address poolAddress, enum MockVault.PoolSpecialization poolSpec` (external)





### `getPoolTokens(bytes32 poolId) → contract IERC20[] tokens, uint256[] balances, uint256 lastChangeBlock` (external)





### `setBalances(uint256[] balances)` (external)





### `joinPool(bytes32 poolId, address sender, address recipient, struct MockVault.JoinPoolRequest request)` (external)





### `exitPool(bytes32 poolId, address sender, address payable recipient, struct MockVault.ExitPoolRequest request)` (external)







### `JoinPoolRequest`


contract IAsset[] assets


uint256[] maxAmountsIn


bytes userData


bool fromInternalBalance


### `ExitPoolRequest`


contract IAsset[] assets


uint256[] minAmountsOut


bytes userData


bool toInternalBalance



### `PoolSpecialization`











