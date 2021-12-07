// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./TokenTimelock.sol";

contract LinearTokenTimelock is TokenTimelock {

    constructor (
        address _beneficiary,
        uint256 _duration,
        address _lockedToken
    ) TokenTimelock(_beneficiary, _duration, 0, _lockedToken, address(0)) {}

    function _proportionAvailable(
        uint256 initialBalance,
        uint256 elapsed,
        uint256 duration
    ) internal pure override returns (uint256) {
        return initialBalance * elapsed / duration;
    }
}
