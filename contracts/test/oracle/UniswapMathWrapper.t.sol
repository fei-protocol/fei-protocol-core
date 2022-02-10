// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.4.0 <0.8.0;

import {MockObservable} from "@uniswap/v3-periphery/contracts/test/MockObservable.sol";
import {UniswapMathWrapper} from "../../oracle/uniswap/UniswapMathWrapper.sol";
import {DSTest} from "../utils/DSTest.sol";

contract UniswapMathWrapperTest is DSTest {
  MockObservable private mockPool;
  UniswapMathWrapper private uniswapMathWrapper;

  uint32 private secondsAgo = 3;
  uint32[] private secondsAgoRange = [secondsAgo, 0];
  int56[] private tickCumulatives = [12, 12];
  uint160[] private secondsPerLiqCumulatives = [10, 20];

  function setUp() public {
    mockPool = new MockObservable(secondsAgoRange, tickCumulatives, secondsPerLiqCumulatives);
    uniswapMathWrapper = new UniswapMathWrapper();
  }

  function testPrice() public {
    uint256 price = uniswapMathWrapper.calculatePrice(address(mockPool), secondsAgo);
    assertGt(price, 0);
  }
}