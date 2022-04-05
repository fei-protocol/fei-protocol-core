## `BalancerPCVDepositBase`






### `constructor(address _core, address _vault, address _rewards, bytes32 _poolId, uint256 _maximumSlippageBasisPoints)` (internal)

Balancer PCV Deposit constructor




### `receive()` (external)





### `wrapETH()` (external)

Wraps all ETH held by the contract to WETH
Anyone can call it.
Balancer uses WETH in its pools, and not ETH.



### `unwrapETH()` (external)

unwrap WETH on the contract, for instance before
sending to another PCVDeposit that needs pure ETH.
Balancer uses WETH in its pools, and not ETH.



### `setMaximumSlippage(uint256 _maximumSlippageBasisPoints)` (external)

Sets the maximum slippage vs 1:1 price accepted during withdraw.




### `exitPool(address _to)` (external)

redeeem all assets from LP pool




### `claimRewards(uint256 distributionId, uint256 amount, bytes32[] merkleProof)` (external)

claim BAL rewards associated to this PCV Deposit.
Note that if dual incentives are active, this will only claim BAL rewards.
For more context, see the following links :
- https://docs.balancer.fi/products/merkle-orchard
- https://docs.balancer.fi/products/merkle-orchard/claiming-tokens
A permissionless manual claim can always be done directly on the
MerkleOrchard contract, on behalf of this PCVDeposit. This function is
provided solely for claiming more conveniently the BAL rewards.




### `UpdateMaximumSlippage(uint256 maximumSlippageBasisPoints)`





### `ClaimRewards(address _caller, address _token, address _to, uint256 _amount)`

event generated when rewards are claimed



### `ExitPool(bytes32 _poodId, address _to, uint256 _bptAmount)`







