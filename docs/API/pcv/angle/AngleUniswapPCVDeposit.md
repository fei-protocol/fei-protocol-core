## `AngleUniswapPCVDeposit`






### `constructor(address _core, address _pair, address _router, address _oracle, address _backupOracle, uint256 _maxBasisPointsFromPegLP, contract IStableMaster _stableMaster, contract IPoolManager _poolManager, contract IStakingRewards _stakingRewards)` (public)

Uniswap PCV Deposit constructor




### `claimRewards()` (external)

claim staking rewards



### `mintAgToken(uint256 amountFei)` (public)

mint agToken from FEI


the call will revert if slippage is too high compared to oracle.

### `burnAgToken(uint256 amountAgToken)` (public)

burn agToken for FEI


the call will revert if slippage is too high compared to oracle

### `burnAgTokenAll()` (external)

burn ALL agToken held for FEI


see burnAgToken(uint256 amount).

### `setPair(address _pair)` (public)

set the new pair contract


also approves the router for the new pair token and underlying token

### `setStakingRewards(contract IStakingRewards _stakingRewards)` (public)

set a new stakingRewards address




### `setPoolManager(contract IPoolManager _poolManager)` (public)

set a new poolManager address




### `liquidityOwned() → uint256` (public)

amount of pair liquidity owned by this contract




### `_removeLiquidity(uint256 liquidity) → uint256` (internal)





### `_addLiquidity(uint256 tokenAmount, uint256 feiAmount)` (internal)








