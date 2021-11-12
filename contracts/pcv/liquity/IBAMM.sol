// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

// Ref: https://github.com/backstop-protocol/dev/blob/main/packages/contracts/contracts/B.Protocol/BAMM.sol
interface IBAMM {

    // Views

    function fetchPrice() external view returns (uint256);

    function getSwapEthAmount(uint256 lusdQty) external view returns (uint256 ethAmount, uint256 feeEthAmount);

    function LUSD() external view returns (address);

    function SP() external view returns (address);

    function balanceOf(address account) external view returns (uint256);

    function totalSupply() external view returns (uint256);

    // Reward token
    function bonus() external view returns (address);

    // Mutative Functions

    function deposit(uint256 lusdAmount) external;

    function withdraw(uint256 numShares) external;

    function swap(uint256 lusdAmount, uint256 minEthReturn, address dest) external returns(uint256);
}