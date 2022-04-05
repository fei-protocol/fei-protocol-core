## <span id="MockVault"></span> `MockVault`



- [`constructor(contract IERC20[] tokens, address owner)`][MockVault-constructor-contract-IERC20---address-]
- [`setMockDoTransfers(bool flag)`][MockVault-setMockDoTransfers-bool-]
- [`getPool(bytes32 poolId)`][MockVault-getPool-bytes32-]
- [`getPoolTokens(bytes32 poolId)`][MockVault-getPoolTokens-bytes32-]
- [`setBalances(uint256[] balances)`][MockVault-setBalances-uint256---]
- [`joinPool(bytes32 poolId, address sender, address recipient, struct MockVault.JoinPoolRequest request)`][MockVault-joinPool-bytes32-address-address-struct-MockVault-JoinPoolRequest-]
- [`exitPool(bytes32 poolId, address sender, address payable recipient, struct MockVault.ExitPoolRequest request)`][MockVault-exitPool-bytes32-address-address-payable-struct-MockVault-ExitPoolRequest-]
### <span id="MockVault-constructor-contract-IERC20---address-"></span> `constructor(contract IERC20[] tokens, address owner)` (public)



### <span id="MockVault-setMockDoTransfers-bool-"></span> `setMockDoTransfers(bool flag)` (external)



### <span id="MockVault-getPool-bytes32-"></span> `getPool(bytes32 poolId) → address poolAddress, enum MockVault.PoolSpecialization poolSpec` (external)



### <span id="MockVault-getPoolTokens-bytes32-"></span> `getPoolTokens(bytes32 poolId) → contract IERC20[] tokens, uint256[] balances, uint256 lastChangeBlock` (external)



### <span id="MockVault-setBalances-uint256---"></span> `setBalances(uint256[] balances)` (external)



### <span id="MockVault-joinPool-bytes32-address-address-struct-MockVault-JoinPoolRequest-"></span> `joinPool(bytes32 poolId, address sender, address recipient, struct MockVault.JoinPoolRequest request)` (external)



### <span id="MockVault-exitPool-bytes32-address-address-payable-struct-MockVault-ExitPoolRequest-"></span> `exitPool(bytes32 poolId, address sender, address payable recipient, struct MockVault.ExitPoolRequest request)` (external)



