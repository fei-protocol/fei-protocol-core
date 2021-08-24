// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./TokenTimelock.sol";

contract QuadraticTokenTimelock is TokenTimelock {

    constructor (
        address _beneficiary,
        uint256 _duration,
        address _lockedToken
    ) TokenTimelock(
        _beneficiary, 
        _duration, 
        7776000, // 3 months cliff
        _lockedToken, 
        address(0xB8f482539F2d3Ae2C9ea6076894df36D1f632775) // fei labs multisig
    ) {}

    function _proportionAvailable(
        uint256 initialBalance,
        uint256 elapsed,
        uint256 duration
    ) internal pure override returns (uint256) {
        return initialBalance * elapsed * elapsed / duration / duration;
    }
}
