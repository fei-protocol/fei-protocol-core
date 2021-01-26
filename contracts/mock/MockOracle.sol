pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../external/Decimal.sol";
import "../oracle/IOracle.sol";

contract MockOracle is IOracle {
    using Decimal for Decimal.D256;

    // fixed exchange ratio
    uint256 _usdPerEth;
	bool public override killSwitch;
    bool public updated;
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

    function setValid(bool isValid) public {
        valid = isValid;
    }

    function setExchangeRate(uint256 usdPerEth) public {
        _usdPerEth = usdPerEth;
    }

	function setKillSwitch(bool _killSwitch) public override {
		killSwitch = _killSwitch;
	}
}