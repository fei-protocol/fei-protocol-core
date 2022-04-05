## `BalancerLBPSwapper`

an auction contract which cyclically sells one token for another using Balancer LBP




### `constructor(address _core, struct BalancerLBPSwapper.OracleData oracleData, uint256 _frequency, uint256 _weightSmall, uint256 _weightLarge, address _tokenSpent, address _tokenReceived, address _tokenReceivingAddress, uint256 _minTokenSpentBalance)` (public)

constructor for BalancerLBPSwapper
    @param _core Core contract to reference
    @param oracleData The parameters needed to initialize the OracleRef
    @param _frequency minimum time between auctions and duration of auction
    @param _weightSmall the small weight of weight changes (e.g. 5%)
    @param _weightLarge the large weight of weight changes (e.g. 95%)
    @param _tokenSpent the token to be auctioned
    @param _tokenReceived the token to buy
    @param _tokenReceivingAddress the address to send `tokenReceived`
    @param _minTokenSpentBalance the minimum amount of tokenSpent to kick off a new auction on swap()



### `init(contract IWeightedPool _pool)` (external)

initialize Balancer LBP
    Needs to be a separate method because this contract needs to be deployed and supplied
    as the owner of the pool on construction.
    Includes various checks to ensure the pool contract is correct and initialization can only be done once
    @param _pool the Balancer LBP used for swapping



### `swap()` (external)

Swap algorithm
        1. Withdraw existing LP tokens
        2. Reset weights
        3. Provide new liquidity
        4. Trigger gradual weight change
        5. Transfer remaining tokenReceived to tokenReceivingAddress
        @dev assumes tokenSpent balance of contract exceeds minTokenSpentBalance to kick off a new auction



### `forceSwap()` (external)

Force a swap() call, without waiting afterTime.
        This should only be callable after init() call, when no
        other swap is happening (call reverts if weight change
        is in progress).



### `exitPool(address to)` (external)

redeeem all assets from LP pool




### `withdrawERC20(address token, address to, uint256 amount)` (public)

withdraw ERC20 from the contract




### `swapEndTime() → uint256 endTime` (public)

returns when the next auction ends



### `setSwapFrequency(uint256 _frequency)` (external)

sets the minimum time between swaps




### `setMinTokenSpent(uint256 newMinTokenSpentBalance)` (external)

sets the minimum token spent balance




### `setReceivingAddress(address newTokenReceivingAddress)` (external)

Sets the address receiving swap's inbound tokens




### `getTokensIn(uint256 spentTokenBalance) → address[] tokens, uint256[] amountsIn` (external)

return the amount of tokens needed to seed the next auction



### `_swap()` (internal)

Swap algorithm
        1. Withdraw existing LP tokens
        2. Reset weights
        3. Provide new liquidity
        4. Trigger gradual weight change
        5. Transfer remaining tokenReceived to tokenReceivingAddress
        @dev assumes tokenSpent balance of contract exceeds minTokenSpentBalance to kick off a new auction



### `_exitPool()` (internal)





### `_transferAll(address token, address to)` (internal)





### `_setReceivingAddress(address newTokenReceivingAddress)` (internal)





### `_initializePool()` (internal)





### `_getTokensIn(uint256 spentTokenBalance) → uint256[] amountsIn` (internal)





### `_setMinTokenSpent(uint256 newMinTokenSpentBalance)` (internal)






### `WithdrawERC20(address _caller, address _token, address _to, uint256 _amount)`





### `ExitPool()`





### `MinTokenSpentUpdate(uint256 oldMinTokenSpentBalance, uint256 newMinTokenSpentBalance)`






### `OracleData`


address _oracle


address _backupOracle


bool _invertOraclePrice


int256 _decimalsNormalizer



