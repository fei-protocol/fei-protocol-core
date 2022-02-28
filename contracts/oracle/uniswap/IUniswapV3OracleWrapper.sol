// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

/// @title Interface for UniswapV3OracleWrapper
interface IUniswapV3OracleWrapper {
    function getTwapPeriod() external view returns (uint32);

    function setTwapPeriod(uint32 _twapPeriod) external;
}
