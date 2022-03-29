// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

/// @title Interface for UniswapV3OracleWrapper
interface IUniswapV3OracleWrapper {
    /// @notice An event emitted when the TWAP period is updated
    event TwapPeriodUpdate(
        address indexed pool,
        uint32 oldTwapPeriod,
        uint32 newTwapPeriod
    );

    /// @notice An event emitted when a Uniswap pool has oracle support added
    event AddPoolSupport(
        address indexed pool,
        uint32 twapPeriod,
        uint16 cardinality
    );

    function getTwapPeriod() external view returns (uint32);

    function setTwapPeriod(uint32 _twapPeriod) external;
}
