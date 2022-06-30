// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

// Angle PoolManager contract
interface IPoolManager {
    function token() external returns (address);

    function getBalance() external view returns (uint256);

    function setStrategyEmergencyExit(address) external;

    function withdrawFromStrategy(address, uint256) external;

    function updateStrategyDebtRatio(address, uint256) external;
}
