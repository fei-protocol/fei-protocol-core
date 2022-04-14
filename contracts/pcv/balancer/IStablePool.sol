// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./IBasePool.sol";

// interface with methods from Balancer V2 Stable Pool
interface IStablePool is IBasePool {
    function getLastInvariant()
        external
        view
        returns (uint256 lastInvariant, uint256 lastInvariantAmp);

    // This function returns the appreciation of one BPT relative to the
    // underlying tokens. This starts at 1 when the pool is created and grows over time.
    function getRate() external view returns (uint256);

    // Begins changing the amplification parameter to `rawEndValue` over time. The value will change linearly until
    // `endTime` is reached, when it will be `rawEndValue`.
    // NOTE: Internally, the amplification parameter is represented using higher precision. The values returned by
    // `getAmplificationParameter` have to be corrected to account for this when comparing to `rawEndValue`.
    function startAmplificationParameterUpdate(
        uint256 rawEndValue,
        uint256 endTime
    ) external;

    function stopAmplificationParameterUpdate() external;

    function getAmplificationParameter()
        external
        view
        returns (
            uint256 value,
            bool isUpdating,
            uint256 precision
        );
}
