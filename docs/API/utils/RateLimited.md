## `RateLimited`






### `constructor(uint256 _maxRateLimitPerSecond, uint256 _rateLimitPerSecond, uint256 _bufferCap, bool _doPartialAction)` (internal)





### `setRateLimitPerSecond(uint256 newRateLimitPerSecond)` (external)

set the rate limit per second



### `setBufferCap(uint256 newBufferCap)` (external)

set the buffer cap



### `buffer() → uint256` (public)

the amount of action used before hitting limit


replenishes at rateLimitPerSecond per second up to bufferCap

### `_depleteBuffer(uint256 amount) → uint256` (internal)

the method that enforces the rate limit. Decreases buffer by "amount". 
        If buffer is <= amount either
        1. Does a partial mint by the amount remaining in the buffer or
        2. Reverts
        Depending on whether doPartialAction is true or false



### `_setRateLimitPerSecond(uint256 newRateLimitPerSecond)` (internal)





### `_setBufferCap(uint256 newBufferCap)` (internal)





### `_resetBuffer()` (internal)





### `_updateBufferStored()` (internal)






### `BufferUsed(uint256 amountUsed, uint256 bufferRemaining)`





### `BufferCapUpdate(uint256 oldBufferCap, uint256 newBufferCap)`





### `RateLimitPerSecondUpdate(uint256 oldRateLimitPerSecond, uint256 newRateLimitPerSecond)`







