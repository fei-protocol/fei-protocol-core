pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../external/Decimal.sol";
import "../oracle/IOracle.sol";

contract MockOracle is IOracle {
    using Decimal for Decimal.D256;

    // fixed exchange ratio
    uint256 public _usdPerEth;
    bool public updated;
    bool public outdated;
    bool public valid = true;

    constructor(uint256 usdPerEth) public {
        _usdPerEth = usdPerEth;
    }

    function update() public override returns (bool) {
        updated = true;
        return true;
    }

    function read() public view override returns (Decimal.D256 memory, bool) {
        Decimal.D256 memory price = Decimal.from(_usdPerEth); 
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
        _usdPerEth = usdPerEth;
    }
}