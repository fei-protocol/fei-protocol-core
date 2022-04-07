// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@uniswap/lib/contracts/libraries/FixedPoint.sol";

contract MockUniswapV2PairTrade {
    uint256 public price0CumulativeLast;
    uint256 public price1CumulativeLast;

    uint112 public reserve0;
    uint112 public reserve1;
    uint32 public blockTimestampLast;

    constructor(
        uint256 _price0CumulativeLast,
        uint256 _price1CumulativeLast,
        uint32 _blockTimestampLast,
        uint112 r0,
        uint112 r1
    ) {
        set(_price0CumulativeLast, _price1CumulativeLast, _blockTimestampLast);
        setReserves(r0, r1);
    }

    function getReserves()
        public
        view
        returns (
            uint112,
            uint112,
            uint32
        )
    {
        return (reserve0, reserve1, blockTimestampLast);
    }

    function simulateTrade(
        uint112 newReserve0,
        uint112 newReserve1,
        uint32 blockTimestamp
    ) external {
        uint32 timeElapsed = blockTimestamp - blockTimestampLast;
        if (timeElapsed > 0 && reserve0 != 0 && reserve1 != 0) {
            price0CumulativeLast +=
                uint256(FixedPoint.fraction(reserve1, reserve0)._x) *
                timeElapsed;
            price1CumulativeLast +=
                uint256(FixedPoint.fraction(reserve0, reserve1)._x) *
                timeElapsed;
        }
        reserve0 = newReserve0;
        reserve1 = newReserve1;
        blockTimestampLast = blockTimestamp;
    }

    function set(
        uint256 _price0CumulativeLast,
        uint256 _price1CumulativeLast,
        uint32 _blockTimestampLast
    ) public {
        price0CumulativeLast = _price0CumulativeLast;
        price1CumulativeLast = _price1CumulativeLast;
        blockTimestampLast = _blockTimestampLast;
    }

    function setReserves(uint112 r0, uint112 r1) public {
        reserve0 = r0;
        reserve1 = r1;
    }
}
