// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./FixedTokenTimelockUpgradeable.sol";

contract FixedQuadraticTokenTimelockUpgradeable is Initializable, FixedTokenTimelockUpgradeable {

    function initialize(
        address _beneficiary,
        uint256 _duration,
        address _lockedToken,
        uint256 _cliffDuration,
        address _clawbackAdmin,
        uint256 _lockedAmount,
        uint256 _startTime
    ) external initializer {
        __FixedTokenTimelock_init(
            _beneficiary, 
            _duration, 
            _lockedToken, 
            _cliffDuration,
            _clawbackAdmin,
            _lockedAmount
        );

        if (_startTime != 0) {
            startTime = _startTime;
        }
    }

    function _proportionAvailable(
        uint256 initialBalance,
        uint256 elapsed,
        uint256 duration
    ) internal pure override returns (uint256) {
        return initialBalance * elapsed * elapsed / duration / duration;
    }
}
