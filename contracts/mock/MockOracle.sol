// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../external/Decimal.sol";
import "../oracle/IOracle.sol";

contract MockOracle is IOracle {
    using Decimal for Decimal.D256;

    // fixed exchange ratio
    bool public updated;
    bool public outdated;
    bool public valid = true;
    Decimal.D256 public price;

    constructor(uint256 usdPerEth) {
        price = Decimal.from(usdPerEth);
    }

    function update() public override {
        updated = true;
    }

    function read() public view override returns (Decimal.D256 memory, bool) {
        return (price, valid);
    }

    function isOutdated() public view override returns(bool) {
        return outdated;
    }

    function setOutdated(bool _outdated) public {
        outdated = _outdated;
    }

    function setValid(bool isValid) public {
        valid = isValid;
    }

    function setExchangeRate(uint256 usdPerEth) public {
        price = Decimal.from(usdPerEth);
    }

    function setExchangeRateScaledBase(uint256 usdPerEth) public {
        price = Decimal.D256({ value: usdPerEth });
    }
}