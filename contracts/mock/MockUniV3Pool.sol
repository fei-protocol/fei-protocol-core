// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.4.0 <0.8.0;

contract MockUniV3Pool {
    uint128 public liquidity = 50001;

    address public token0;

    address public token1;

    struct Slot0 {
        // the current price
        uint160 sqrtPriceX96;
        // the current tick
        int24 tick;
        // the most-recently updated index of the observations array
        uint16 observationIndex;
        // the current maximum number of observations that are being stored
        uint16 observationCardinality;
        // the next maximum number of observations to store, triggered in observations.write
        uint16 observationCardinalityNext;
        // the current protocol fee as a percentage of the swap fee taken on withdrawal
        // represented as an integer denominator (1/x)%
        uint8 feeProtocol;
        // whether the pool is locked
        bool unlocked;
    }

    Slot0 public slot0 =
        Slot0({
            sqrtPriceX96: uint160(5),
            tick: int24(3000),
            observationIndex: uint16(3000),
            observationCardinality: uint16(3000),
            observationCardinalityNext: uint16(3001),
            feeProtocol: uint8(0),
            unlocked: true
        });

    function observe(uint32[] calldata)
        external
        view
        returns (
            int56[] memory tickCumulatives,
            uint160[] memory secondsPerLiquidityCumulativeX128s
        )
    {
        tickCumulatives = new int56[](2);
        tickCumulatives[0] = int56(12);
        tickCumulatives[1] = int56(12);

        secondsPerLiquidityCumulativeX128s = new uint160[](2);
        secondsPerLiquidityCumulativeX128s[0] = uint160(10);
        secondsPerLiquidityCumulativeX128s[1] = uint160(20);
    }

    function increaseObservationCardinalityNext(uint16 cardinality) external {}

    // NOTE: Not part of the UnisV3Pool interface. Test method only
    function mockSetTokens(address tokenA, address tokenB) external {
        (address _token0, address _token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);
        token0 = _token0;
        token1 = _token1;
    }
}
