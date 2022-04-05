## <span id="IWeightedPool"></span> `IWeightedPool`



- [`getSwapEnabled()`][IWeightedPool-getSwapEnabled--]
- [`getNormalizedWeights()`][IWeightedPool-getNormalizedWeights--]
- [`getGradualWeightUpdateParams()`][IWeightedPool-getGradualWeightUpdateParams--]
- [`setSwapEnabled(bool swapEnabled)`][IWeightedPool-setSwapEnabled-bool-]
- [`updateWeightsGradually(uint256 startTime, uint256 endTime, uint256[] endWeights)`][IWeightedPool-updateWeightsGradually-uint256-uint256-uint256---]
- [`withdrawCollectedManagementFees(address recipient)`][IWeightedPool-withdrawCollectedManagementFees-address-]
- [`getSwapFeePercentage()`][IBasePool-getSwapFeePercentage--]
- [`setSwapFeePercentage(uint256 swapFeePercentage)`][IBasePool-setSwapFeePercentage-uint256-]
- [`setAssetManagerPoolConfig(contract IERC20 token, struct IAssetManager.PoolConfig poolConfig)`][IBasePool-setAssetManagerPoolConfig-contract-IERC20-struct-IAssetManager-PoolConfig-]
- [`setPaused(bool paused)`][IBasePool-setPaused-bool-]
- [`getVault()`][IBasePool-getVault--]
- [`getPoolId()`][IBasePool-getPoolId--]
- [`getOwner()`][IBasePool-getOwner--]
- [`totalSupply()`][IERC20-totalSupply--]
- [`balanceOf(address account)`][IERC20-balanceOf-address-]
- [`transfer(address to, uint256 amount)`][IERC20-transfer-address-uint256-]
- [`allowance(address owner, address spender)`][IERC20-allowance-address-address-]
- [`approve(address spender, uint256 amount)`][IERC20-approve-address-uint256-]
- [`transferFrom(address from, address to, uint256 amount)`][IERC20-transferFrom-address-address-uint256-]
- [`Transfer(address from, address to, uint256 value)`][IERC20-Transfer-address-address-uint256-]
- [`Approval(address owner, address spender, uint256 value)`][IERC20-Approval-address-address-uint256-]
### <span id="IWeightedPool-getSwapEnabled--"></span> `getSwapEnabled() → bool` (external)



### <span id="IWeightedPool-getNormalizedWeights--"></span> `getNormalizedWeights() → uint256[]` (external)



### <span id="IWeightedPool-getGradualWeightUpdateParams--"></span> `getGradualWeightUpdateParams() → uint256 startTime, uint256 endTime, uint256[] endWeights` (external)



### <span id="IWeightedPool-setSwapEnabled-bool-"></span> `setSwapEnabled(bool swapEnabled)` (external)



### <span id="IWeightedPool-updateWeightsGradually-uint256-uint256-uint256---"></span> `updateWeightsGradually(uint256 startTime, uint256 endTime, uint256[] endWeights)` (external)



### <span id="IWeightedPool-withdrawCollectedManagementFees-address-"></span> `withdrawCollectedManagementFees(address recipient)` (external)



