// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./IStabilityPool.sol";

// Ref: https://github.com/backstop-protocol/dev/blob/main/packages/contracts/contracts/B.Protocol/BAMM.sol
interface IBAMM {

    // Views

    /// @notice returns ETH price scaled by 1e18
    function fetchPrice() external view returns (uint256);

    /// @notice returns amount of ETH received for an LUSD swap
    function getSwapEthAmount(uint256 lusdQty) external view returns (uint256 ethAmount, uint256 feeEthAmount);

    /// @notice LUSD token address
    function LUSD() external view returns (IERC20);

    /// @notice Liquity Stability Pool Address
    function SP() external view returns (IStabilityPool);

    /// @notice BAMM shares held by user
    function balanceOf(address account) external view returns (uint256);

    /// @notice total BAMM shares
    function totalSupply() external view returns (uint256);

    /// @notice Reward token
    function bonus() external view returns (address);

    // Mutative Functions

    /// @notice deposit LUSD for shares in BAMM
    function deposit(uint256 lusdAmount) external;

    /// @notice withdraw shares  in BAMM for LUSD + ETH
    function withdraw(uint256 numShares) external;

    /// @notice transfer shares
    function transfer(address to, uint256 amount) external;

    /// @notice swap LUSD to ETH in BAMM
    function swap(uint256 lusdAmount, uint256 minEthReturn, address dest) external returns(uint256);
} 