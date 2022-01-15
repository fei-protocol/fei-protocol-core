// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

abstract contract InterestRateModel {
    uint256 public blocksPerYear;
    uint256 public jumpMultiplierPerBlock;
    uint256 public multiplierPerBlock;
    uint256 public kink;
}