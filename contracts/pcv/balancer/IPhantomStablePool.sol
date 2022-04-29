// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./IStablePool.sol";

// interface with methods from Balancer V2 Stable Pool
interface IPhantomStablePool is IStablePool {
    function getMinimumBpt() external view returns (uint256);

    // index of tokens in pool
    // the linear pool has its own BPT as one of the 3 assets of the pool
    function getBptIndex() external view returns (uint256);

    function getDueProtocolFeeBptAmount() external view returns (uint256);

    function getScalingFactor(address token) external view returns (uint256);

    function getRateProviders() external view returns (address[] memory providers);

    // Returns the token rate for token. All token rates are fixed-point values with 18 decimals.
    // In case there is no rate provider for the provided token it returns 1e18.
    function getTokenRate(address token) external view returns (uint256);

    // Returns the cached value for token's rate.
    // Note it could return an empty value if the requested token does not have one or if the token does not belong
    // to the pool.
    function getTokenRateCache(address token)
        external
        view
        returns (
            uint256 rate,
            uint256 duration,
            uint256 expires
        );

    // Sets a new duration for a token rate cache. It reverts if there was no rate provider set initially.
    // Note this function also updates the current cached value.
    function setTokenRateCacheDuration(address token, uint256 duration) external;

    function updateTokenRateCache(address token) external;

    function getCachedProtocolSwapFeePercentage() external view returns (uint256);

    function updateCachedProtocolSwapFeePercentage() external;

    // In other pools, this would be the same as `totalSupply`, but since this pool pre-mints all BPT, `totalSupply`
    // remains constant, whereas `virtualSupply` increases as users join the pool and decreases as they exit it.
    function getVirtualSupply() external view returns (uint256);
}
