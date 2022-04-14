// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./IBasePool.sol";

// interface with methods from Balancer V2 LinearPools
interface ILinearPool is IBasePool {
    // addresses of tokens in the pool
    function getMainToken() external view returns (address);

    function getWrappedToken() external view returns (address);

    // index of tokens in pool
    // the linear pool has its own BPT as one of the 3 assets of the pool
    function getBptIndex() external view returns (uint256);

    function getMainIndex() external view returns (uint256);

    function getWrappedIndex() external view returns (uint256);

    // the rate represents the appreciation of BPT with respect to the underlying token
    function getRate() external view returns (uint256);

    // the wrapped token rate represents the appreciation of wrapped token w.r.t. the underlying token
    function getWrappedTokenRate() external view returns (uint256);

    // Linear Pools feature a lower and upper target that represent the desired range of values for the
    // main token balance. Any action that moves the main balance away from this range is charged a proportional fee,
    // and any action that moves it towards this range is incentivized by paying the actor using these collected fees.
    function getTargets()
        external
        view
        returns (uint256 lowerTarget, uint256 upperTarget);

    function setTargets(uint256 newLowerTarget, uint256 newUpperTarget)
        external;

    // In other pools, this would be the same as `totalSupply`, but since this pool pre-mints all BPT, `totalSupply`
    // remains constant, whereas `virtualSupply` increases as users join the pool and decreases as they exit it.
    function getVirtualSupply() external view returns (uint256);
}
