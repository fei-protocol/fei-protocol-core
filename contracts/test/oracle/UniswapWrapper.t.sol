// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.4.0 <0.8.0;

import {MockUniV3Pool} from "../../mock/MockUniV3Pool.sol";
import {UniswapWrapper} from "../../oracle/uniswap/UniswapWrapper.sol";
import {DSTest} from "../utils/DSTest.sol";

contract UniswapWrapperTest is DSTest {
  MockUniV3Pool private mockPool;
  UniswapWrapper private uniswapWrapper;

  uint32 private secondsAgo = 3;

  function setUp() public {
    // Mock has an observe() method that returns predefined test values. Used to ensure price > 0
    mockPool = new MockUniV3Pool();
    uniswapWrapper = new UniswapWrapper();
  }

  function testPrice() public {
    uint256 price = uniswapWrapper.calculatePrice(
      address(mockPool),
      secondsAgo,
      address(0x2),
      address(0x3),
      uint8(18),
      uint8(18)
    );
    
    assertGt(price, 0);    
  }
}