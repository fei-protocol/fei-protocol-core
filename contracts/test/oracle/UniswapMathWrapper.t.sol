// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.4.0 <0.8.0;

import {MockUniV3Pool} from "../../mock/MockUniV3Pool.sol";
import {UniswapMathWrapper} from "../../oracle/uniswap/UniswapMathWrapper.sol";
import {DSTest} from "../utils/DSTest.sol";

contract UniswapMathWrapperTest is DSTest {
  MockUniV3Pool private mockPool;
  UniswapMathWrapper private uniswapMathWrapper;

  uint32 private secondsAgo = 3;

  function setUp() public {
    // Mock has an observe() method that returns predefined test values. Used to ensure price > 0
    mockPool = new MockUniV3Pool();
    uniswapMathWrapper = new UniswapMathWrapper();
  }

  function testPrice() public {
    uint256 price = uniswapMathWrapper.calculatePrice(address(mockPool), secondsAgo);
    assertGt(price, 0);
  }
}