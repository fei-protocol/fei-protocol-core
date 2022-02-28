// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.4.0 <0.8.0;

import {MockUniV3Pool} from "../../../mock/MockUniV3Pool.sol";
import {UniswapWrapper} from "../../../oracle/uniswap/UniswapWrapper.sol";
import {MockUniswapWrapper} from "../../../mock/MockUniswapWrapper.sol";
import {DSTest} from "../../utils/DSTest.sol";

contract UniswapWrapperTest is DSTest {
    MockUniV3Pool private mockPool;
    UniswapWrapper private uniswapWrapper;

    uint32 private secondsAgo = 3;

    function setUp() public {
        // Mock has an observe() method that returns predefined test values. Used to ensure price > 0
        mockPool = new MockUniV3Pool();
        uniswapWrapper = new UniswapWrapper();
    }

    /// @notice Validate decimal normaliser factor when token0Decimals > token1Decimals
    function testDecimalNormaliserGreater() public {
        // Deploy MockUniswapWrapper which exposes internal methods for testing purposes
        MockUniswapWrapper mockUniswapWrapper = new MockUniswapWrapper();
        uint8 token0Decimals = 18;
        uint8 token1Decimals = 6;

        (uint256 normalisingFactor, bool invert) = mockUniswapWrapper
            .callCalculateDecimalNormaliser(token0Decimals, token1Decimals);
        assertFalse(invert);
        assertEq(normalisingFactor, 10**(token0Decimals - token1Decimals));
    }

    /// @notice Validate decimal normaliser factor when token0Decimals < token1Decimals
    function testDecimalNormaliserLess() public {
        MockUniswapWrapper mockUniswapWrapper = new MockUniswapWrapper();

        uint8 token0Decimals = 6;
        uint8 token1Decimals = 18;

        (uint256 normalisingFactor, bool invert) = mockUniswapWrapper
            .callCalculateDecimalNormaliser(token0Decimals, token1Decimals);
        assertTrue(invert);
        assertEq(normalisingFactor, 10**(token1Decimals - token0Decimals));
    }

    /// @notice Validate that a price can be calculated. Price value tests performed in integration tests
    function testPrice() public {
        uint256 price = uniswapWrapper.calculatePrice(
            address(mockPool),
            secondsAgo,
            address(0x2),
            address(0x3),
            uint8(18),
            uint8(18),
            uint256(10**18)
        );

        assertGt(price, 0);
    }
}
