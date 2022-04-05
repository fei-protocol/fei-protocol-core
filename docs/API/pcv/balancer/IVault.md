## `IVault`



Full external interface for the Vault core contract - no external or public methods exist in the contract that
don't override one of these declarations.


### `hasApprovedRelayer(address user, address relayer) → bool` (external)



Returns true if `user` has approved `relayer` to act as a relayer for them.

### `setRelayerApproval(address sender, address relayer, bool approved)` (external)



Allows `relayer` to act as a relayer for `sender` if `approved` is true, and disallows it otherwise.

Emits a `RelayerApprovalChanged` event.

### `getInternalBalance(address user, contract IERC20[] tokens) → uint256[]` (external)



Returns `user`'s Internal Balance for a set of tokens.

### `manageUserBalance(struct IVault.UserBalanceOp[] ops)` (external)



Performs a set of user balance operations, which involve Internal Balance (deposit, withdraw or transfer)
and plain ERC20 transfers using the Vault's allowance. This last feature is particularly useful for relayers, as
it lets integrators reuse a user's Vault allowance.

For each operation, if the caller is not `sender`, it must be an authorized relayer for them.

### `registerPool(enum IVault.PoolSpecialization specialization) → bytes32` (external)



Registers the caller account as a Pool with a given specialization setting. Returns the Pool's ID, which
is used in all Pool-related functions. Pools cannot be deregistered, nor can the Pool's specialization be
changed.

The caller is expected to be a smart contract that implements either `IGeneralPool` or `IMinimalSwapInfoPool`,
depending on the chosen specialization setting. This contract is known as the Pool's contract.

Note that the same contract may register itself as multiple Pools with unique Pool IDs, or in other words,
multiple Pools may share the same contract.

Emits a `PoolRegistered` event.

### `getPool(bytes32 poolId) → address, enum IVault.PoolSpecialization` (external)



Returns a Pool's contract address and specialization setting.

### `registerTokens(bytes32 poolId, contract IERC20[] tokens, address[] assetManagers)` (external)



Registers `tokens` for the `poolId` Pool. Must be called by the Pool's contract.

Pools can only interact with tokens they have registered. Users join a Pool by transferring registered tokens,
exit by receiving registered tokens, and can only swap registered tokens.

Each token can only be registered once. For Pools with the Two Token specialization, `tokens` must have a length
of two, that is, both tokens must be registered in the same `registerTokens` call, and they must be sorted in
ascending order.

The `tokens` and `assetManagers` arrays must have the same length, and each entry in these indicates the Asset
Manager for the corresponding token. Asset Managers can manage a Pool's tokens via `managePoolBalance`,
depositing and withdrawing them directly, and can even set their balance to arbitrary amounts. They are therefore
expected to be highly secured smart contracts with sound design principles, and the decision to register an
Asset Manager should not be made lightly.

Pools can choose not to assign an Asset Manager to a given token by passing in the zero address. Once an Asset
Manager is set, it cannot be changed except by deregistering the associated token and registering again with a
different Asset Manager.

Emits a `TokensRegistered` event.

### `deregisterTokens(bytes32 poolId, contract IERC20[] tokens)` (external)



Deregisters `tokens` for the `poolId` Pool. Must be called by the Pool's contract.

Only registered tokens (via `registerTokens`) can be deregistered. Additionally, they must have zero total
balance. For Pools with the Two Token specialization, `tokens` must have a length of two, that is, both tokens
must be deregistered in the same `deregisterTokens` call.

A deregistered token can be re-registered later on, possibly with a different Asset Manager.

Emits a `TokensDeregistered` event.

### `getPoolTokenInfo(bytes32 poolId, contract IERC20 token) → uint256 cash, uint256 managed, uint256 lastChangeBlock, address assetManager` (external)



Returns detailed information for a Pool's registered token.

`cash` is the number of tokens the Vault currently holds for the Pool. `managed` is the number of tokens
withdrawn and held outside the Vault by the Pool's token Asset Manager. The Pool's total balance for `token`
equals the sum of `cash` and `managed`.

Internally, `cash` and `managed` are stored using 112 bits. No action can ever cause a Pool's token `cash`,
`managed` or `total` balance to be greater than 2^112 - 1.

`lastChangeBlock` is the number of the block in which `token`'s total balance was last modified (via either a
join, exit, swap, or Asset Manager update). This value is useful to avoid so-called 'sandwich attacks', for
example when developing price oracles. A change of zero (e.g. caused by a swap with amount zero) is considered a
change for this purpose, and will update `lastChangeBlock`.

`assetManager` is the Pool's token Asset Manager.

### `getPoolTokens(bytes32 poolId) → contract IERC20[] tokens, uint256[] balances, uint256 lastChangeBlock` (external)



Returns a Pool's registered tokens, the total balance for each, and the latest block when *any* of
the tokens' `balances` changed.

The order of the `tokens` array is the same order that will be used in `joinPool`, `exitPool`, as well as in all
Pool hooks (where applicable). Calls to `registerTokens` and `deregisterTokens` may change this order.

If a Pool only registers tokens once, and these are sorted in ascending order, they will be stored in the same
order as passed to `registerTokens`.

Total balances include both tokens held by the Vault and those withdrawn by the Pool's Asset Managers. These are
the amounts used by joins, exits and swaps. For a detailed breakdown of token balances, use `getPoolTokenInfo`
instead.

### `joinPool(bytes32 poolId, address sender, address recipient, struct IVault.JoinPoolRequest request)` (external)



Called by users to join a Pool, which transfers tokens from `sender` into the Pool's balance. This will
trigger custom Pool behavior, which will typically grant something in return to `recipient` - often tokenized
Pool shares.

If the caller is not `sender`, it must be an authorized relayer for them.

The `assets` and `maxAmountsIn` arrays must have the same length, and each entry indicates the maximum amount
to send for each asset. The amounts to send are decided by the Pool and not the Vault: it just enforces
these maximums.

If joining a Pool that holds WETH, it is possible to send ETH directly: the Vault will do the wrapping. To enable
this mechanism, the IAsset sentinel value (the zero address) must be passed in the `assets` array instead of the
WETH address. Note that it is not possible to combine ETH and WETH in the same join. Any excess ETH will be sent
back to the caller (not the sender, which is important for relayers).

`assets` must have the same length and order as the array returned by `getPoolTokens`. This prevents issues when
interacting with Pools that register and deregister tokens frequently. If sending ETH however, the array must be
sorted *before* replacing the WETH address with the ETH sentinel value (the zero address), which means the final
`assets` array might not be sorted. Pools with no registered tokens cannot be joined.

If `fromInternalBalance` is true, the caller's Internal Balance will be preferred: ERC20 transfers will only
be made for the difference between the requested amount and Internal Balance (if any). Note that ETH cannot be
withdrawn from Internal Balance: attempting to do so will trigger a revert.

This causes the Vault to call the `IBasePool.onJoinPool` hook on the Pool's contract, where Pools implement
their own custom logic. This typically requires additional information from the user (such as the expected number
of Pool shares). This can be encoded in the `userData` argument, which is ignored by the Vault and passed
directly to the Pool's contract, as is `recipient`.

Emits a `PoolBalanceChanged` event.

### `exitPool(bytes32 poolId, address sender, address payable recipient, struct IVault.ExitPoolRequest request)` (external)



Called by users to exit a Pool, which transfers tokens from the Pool's balance to `recipient`. This will
trigger custom Pool behavior, which will typically ask for something in return from `sender` - often tokenized
Pool shares. The amount of tokens that can be withdrawn is limited by the Pool's `cash` balance (see
`getPoolTokenInfo`).

If the caller is not `sender`, it must be an authorized relayer for them.

The `tokens` and `minAmountsOut` arrays must have the same length, and each entry in these indicates the minimum
token amount to receive for each token contract. The amounts to send are decided by the Pool and not the Vault:
it just enforces these minimums.

If exiting a Pool that holds WETH, it is possible to receive ETH directly: the Vault will do the unwrapping. To
enable this mechanism, the IAsset sentinel value (the zero address) must be passed in the `assets` array instead
of the WETH address. Note that it is not possible to combine ETH and WETH in the same exit.

`assets` must have the same length and order as the array returned by `getPoolTokens`. This prevents issues when
interacting with Pools that register and deregister tokens frequently. If receiving ETH however, the array must
be sorted *before* replacing the WETH address with the ETH sentinel value (the zero address), which means the
final `assets` array might not be sorted. Pools with no registered tokens cannot be exited.

If `toInternalBalance` is true, the tokens will be deposited to `recipient`'s Internal Balance. Otherwise,
an ERC20 transfer will be performed. Note that ETH cannot be deposited to Internal Balance: attempting to
do so will trigger a revert.

`minAmountsOut` is the minimum amount of tokens the user expects to get out of the Pool, for each token in the
`tokens` array. This array must match the Pool's registered tokens.

This causes the Vault to call the `IBasePool.onExitPool` hook on the Pool's contract, where Pools implement
their own custom logic. This typically requires additional information from the user (such as the expected number
of Pool shares to return). This can be encoded in the `userData` argument, which is ignored by the Vault and
passed directly to the Pool's contract.

Emits a `PoolBalanceChanged` event.

### `swap(struct IVault.SingleSwap singleSwap, struct IVault.FundManagement funds, uint256 limit, uint256 deadline) → uint256` (external)



Performs a swap with a single Pool.

If the swap is 'given in' (the number of tokens to send to the Pool is known), it returns the amount of tokens
taken from the Pool, which must be greater than or equal to `limit`.

If the swap is 'given out' (the number of tokens to take from the Pool is known), it returns the amount of tokens
sent to the Pool, which must be less than or equal to `limit`.

Internal Balance usage and the recipient are determined by the `funds` struct.

Emits a `Swap` event.

### `batchSwap(enum IVault.SwapKind kind, struct IVault.BatchSwapStep[] swaps, contract IAsset[] assets, struct IVault.FundManagement funds, int256[] limits, uint256 deadline) → int256[]` (external)



Performs a series of swaps with one or multiple Pools. In each individual swap, the caller determines either
the amount of tokens sent to or received from the Pool, depending on the `kind` value.

Returns an array with the net Vault asset balance deltas. Positive amounts represent tokens (or ETH) sent to the
Vault, and negative amounts represent tokens (or ETH) sent by the Vault. Each delta corresponds to the asset at
the same index in the `assets` array.

Swaps are executed sequentially, in the order specified by the `swaps` array. Each array element describes a
Pool, the token to be sent to this Pool, the token to receive from it, and an amount that is either `amountIn` or
`amountOut` depending on the swap kind.

Multihop swaps can be executed by passing an `amount` value of zero for a swap. This will cause the amount in/out
of the previous swap to be used as the amount in for the current one. In a 'given in' swap, 'tokenIn' must equal
the previous swap's `tokenOut`. For a 'given out' swap, `tokenOut` must equal the previous swap's `tokenIn`.

The `assets` array contains the addresses of all assets involved in the swaps. These are either token addresses,
or the IAsset sentinel value for ETH (the zero address). Each entry in the `swaps` array specifies tokens in and
out by referencing an index in `assets`. Note that Pools never interact with ETH directly: it will be wrapped to
or unwrapped from WETH by the Vault.

Internal Balance usage, sender, and recipient are determined by the `funds` struct. The `limits` array specifies
the minimum or maximum amount of each token the vault is allowed to transfer.

`batchSwap` can be used to make a single swap, like `swap` does, but doing so requires more gas than the
equivalent `swap` call.

Emits `Swap` events.

### `queryBatchSwap(enum IVault.SwapKind kind, struct IVault.BatchSwapStep[] swaps, contract IAsset[] assets, struct IVault.FundManagement funds) → int256[] assetDeltas` (external)



Simulates a call to `batchSwap`, returning an array of Vault asset deltas. Calls to `swap` cannot be
simulated directly, but an equivalent `batchSwap` call can and will yield the exact same result.

Each element in the array corresponds to the asset at the same index, and indicates the number of tokens (or ETH)
the Vault would take from the sender (if positive) or send to the recipient (if negative). The arguments it
receives are the same that an equivalent `batchSwap` call would receive.

Unlike `batchSwap`, this function performs no checks on the sender or recipient field in the `funds` struct.
This makes it suitable to be called by off-chain applications via eth_call without needing to hold tokens,
approve them for the Vault, or even know a user's address.

Note that this function is not 'view' (due to implementation details): the client code must explicitly execute
eth_call instead of eth_sendTransaction.

### `managePoolBalance(struct IVault.PoolBalanceOp[] ops)` (external)



Performs a set of Pool balance operations, which may be either withdrawals, deposits or updates.

Pool Balance management features batching, which means a single contract call can be used to perform multiple
operations of different kinds, with different Pools and tokens, at once.

For each operation, the caller must be registered as the Asset Manager for `token` in `poolId`.

### `setPaused(bool paused)` (external)



Safety mechanism to pause most Vault operations in the event of an emergency - typically detection of an
error in some part of the system.

The Vault can only be paused during an initial time period, after which pausing is forever disabled.

While the contract is paused, the following features are disabled:
- depositing and transferring internal balance
- transferring external balance (using the Vault's allowance)
- swaps
- joining Pools
- Asset Manager interactions

Internal Balance can still be withdrawn, and Pools exited.


### `RelayerApprovalChanged(address relayer, address sender, bool approved)`



Emitted every time a relayer is approved or disapproved by `setRelayerApproval`.

### `InternalBalanceChanged(address user, contract IERC20 token, int256 delta)`



Emitted when a user's Internal Balance changes, either from calls to `manageUserBalance`, or through
interacting with Pools using Internal Balance.

Because Internal Balance works exclusively with ERC20 tokens, ETH deposits and withdrawals will use the WETH
address.

### `ExternalBalanceTransfer(contract IERC20 token, address sender, address recipient, uint256 amount)`



Emitted when a user's Vault ERC20 allowance is used by the Vault to transfer tokens to an external account.

### `PoolRegistered(bytes32 poolId, address poolAddress, enum IVault.PoolSpecialization specialization)`



Emitted when a Pool is registered by calling `registerPool`.

### `TokensRegistered(bytes32 poolId, contract IERC20[] tokens, address[] assetManagers)`



Emitted when a Pool registers tokens by calling `registerTokens`.

### `TokensDeregistered(bytes32 poolId, contract IERC20[] tokens)`



Emitted when a Pool deregisters tokens by calling `deregisterTokens`.

### `PoolBalanceChanged(bytes32 poolId, address liquidityProvider, contract IERC20[] tokens, int256[] deltas, uint256[] protocolFeeAmounts)`



Emitted when a user joins or exits a Pool by calling `joinPool` or `exitPool`, respectively.

### `Swap(bytes32 poolId, contract IERC20 tokenIn, contract IERC20 tokenOut, uint256 amountIn, uint256 amountOut)`



Emitted for each individual swap performed by `swap` or `batchSwap`.

### `PoolBalanceManaged(bytes32 poolId, address assetManager, contract IERC20 token, int256 cashDelta, int256 managedDelta)`



Emitted when a Pool's token Asset Manager alters its balance via `managePoolBalance`.


### `UserBalanceOp`


enum IVault.UserBalanceOpKind kind


contract IAsset asset


uint256 amount


address sender


address payable recipient


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


### `SingleSwap`


bytes32 poolId


enum IVault.SwapKind kind


contract IAsset assetIn


contract IAsset assetOut


uint256 amount


bytes userData


### `BatchSwapStep`


bytes32 poolId


uint256 assetInIndex


uint256 assetOutIndex


uint256 amount


bytes userData


### `FundManagement`


address sender


bool fromInternalBalance


address payable recipient


bool toInternalBalance


### `PoolBalanceOp`


enum IVault.PoolBalanceOpKind kind


bytes32 poolId


contract IERC20 token


uint256 amount



### `UserBalanceOpKind`














### `PoolSpecialization`











### `PoolBalanceChangeKind`








### `SwapKind`








### `PoolBalanceOpKind`











