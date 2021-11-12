// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

interface ILUSDSwapper {
    function swapLUSD(uint256 lusdAmount, uint256 minEthReturn) external;
}