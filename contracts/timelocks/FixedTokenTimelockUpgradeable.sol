// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./TokenTimelockUpgradeable.sol";

contract FixedTokenTimelockUpgradeable is TokenTimelockUpgradeable {
    /// @notice amount of tokens already claimed
    uint256 public immutable claimedAmount;

    function initialize(
        address _beneficiary,
        uint256 _duration,
        address _lockedToken,
        uint256 _cliffDuration,
        address _clawbackAdmin,
        uint256 _lockedAmount
    ) external initializer {
        __TokenTimelock_init(
            _beneficiary, 
            _duration, 
            _cliffDuration,
            _lockedToken, 
            _clawbackAdmin
        );

        require(_lockedAmount > 0, "FixedTokenTimelock: no amount locked");
        initialBalance = _lockedAmount;
    }

    // Prevents incoming LP tokens from messing up calculations
    modifier balanceCheck() {
        _;
    }

    /// @notice amount of tokens released to beneficiary
    function alreadyReleasedAmount() public view override returns (uint256) {
        return initialBalance - claimedAmount;
    }

    function _release(address to, uint256 amount) internal {
        claimedAmount = claimedAmount.add(amount);
        lockedToken.transfer(to, amount);
        emit Release(beneficiary, to, amount);
    }
}
