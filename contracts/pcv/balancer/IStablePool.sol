// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./IBasePool.sol";

// interface with required methods from Balancer V2 StablePool
// https://github.com/balancer-labs/balancer-v2-monorepo/blob/41fd6d909c44a11fa8d8d0ffb06291467283cb51/pkg/pool-stable/contracts/StablePool.sol
interface IStablePool is IBasePool {

    function getAmplificationParameter() external view returns (
        uint256 value,
        bool isUpdating,
        uint256 precision
    );

    /**
     * @dev Begins changing the amplification parameter to `rawEndValue` over time. The value will change linearly until
     * `endTime` is reached, when it will be `rawEndValue`.
     *
     * NOTE: Internally, the amplification parameter is represented using higher precision. The values returned by
     * `getAmplificationParameter` have to be corrected to account for this when comparing to `rawEndValue`.
     */
    function startAmplificationParameterUpdate(uint256 rawEndValue, uint256 endTime) external;

    /**
     * @dev Stops the amplification parameter change process, keeping the current value.
     */
    function stopAmplificationParameterUpdate() external;

    /**
     * @dev This function returns the appreciation of one BPT relative to the
     * underlying tokens. This starts at 1 when the pool is created and grows over time
     */
    function getRate() external view returns (uint256);

    enum JoinKind { INIT, EXACT_TOKENS_IN_FOR_BPT_OUT, TOKEN_IN_FOR_EXACT_BPT_OUT }
    enum ExitKind { EXACT_BPT_IN_FOR_ONE_TOKEN_OUT, EXACT_BPT_IN_FOR_TOKENS_OUT, BPT_IN_FOR_EXACT_TOKENS_OUT }
}
