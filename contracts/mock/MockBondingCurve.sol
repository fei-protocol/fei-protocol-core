// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../external/Decimal.sol";

contract MockBondingCurve {
    bool public atScale;
    bool public allocated;
    Decimal.D256 public getCurrentPrice;

    constructor(bool _atScale, uint256 price) {
        setScale(_atScale);
        setCurrentPrice(price);
    }

    function setScale(bool _atScale) public {
        atScale = _atScale;
    }

    function setCurrentPrice(uint256 price) public {
        getCurrentPrice = Decimal.ratio(price, 100);
    }

    function allocate() public payable {
        allocated = true;
    }

    function purchase(address, uint256)
        public
        payable
        returns (uint256 amountOut)
    {
        return 1;
    }

    function getAmountOut(uint256 amount) public pure returns (uint256) {
        return 10 * amount;
    }

    function getAverageUSDPrice(uint256)
        public
        view
        returns (Decimal.D256 memory)
    {
        return getCurrentPrice;
    }
}
