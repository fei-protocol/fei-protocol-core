// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.4.0 <0.8.0;

contract MockUniV3Pool {
  function observe(uint32[] calldata) external view returns (int56[] memory tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128s) {
    tickCumulatives = new int56[](2);
    tickCumulatives[0] = int56(12);
    tickCumulatives[1] = int56(12);
    
    secondsPerLiquidityCumulativeX128s = new uint160[](2);
    secondsPerLiquidityCumulativeX128s[0] = uint160(10);
    secondsPerLiquidityCumulativeX128s[1] = uint160(20);
  }
}