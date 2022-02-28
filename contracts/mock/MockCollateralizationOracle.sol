// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./MockOracleCoreRef.sol";

contract MockCollateralizationOracle is MockOracleCoreRef {
    uint256 public userCirculatingFei = 1e20;

    uint256 public pcvValue = 5e20;

    constructor(address core, uint256 exchangeRate)
        MockOracleCoreRef(core, exchangeRate)
    {}

    function set(uint256 _userCirculatingFei, uint256 _pcvValue) public {
        userCirculatingFei = _userCirculatingFei;
        pcvValue = _pcvValue;
    }

    function isOvercollateralized() public view returns (bool) {
        return pcvEquityValue() > 0;
    }

    function pcvEquityValue() public view returns (int256) {
        return int256(pcvValue) - int256(userCirculatingFei);
    }

    function pcvStats()
        public
        view
        returns (
            uint256,
            uint256,
            int256,
            bool
        )
    {
        return (pcvValue, userCirculatingFei, pcvEquityValue(), valid);
    }
}
