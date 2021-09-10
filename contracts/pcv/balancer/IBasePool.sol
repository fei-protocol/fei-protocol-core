// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./IAssetManager.sol";
import "./IVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBasePool is IERC20 {

    function getSwapFeePercentage() external view returns (uint256);

    function setSwapFeePercentage(uint256 swapFeePercentage) external;

    function setAssetManagerPoolConfig(IERC20 token, IAssetManager.PoolConfig memory poolConfig) external;

    function setPaused(bool paused) external;

    function getVault() external view returns (IVault);

    function getPoolId() external view returns (bytes32);

    function getOwner() external view returns (address);
}   
