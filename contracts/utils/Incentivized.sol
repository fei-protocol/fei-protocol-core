// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../refs/CoreRef.sol";

/// @title abstract contract for incentivizing keepers
/// @author Fei Protocol
abstract contract Incentivized is CoreRef {

    /// @notice FEI incentive for calling keeper functions
    uint256 public incentiveAmount;

    event IncentiveUpdate(uint256 oldIncentiveAmount, uint256 newIncentiveAmount);

    constructor(uint256 _incentiveAmount) {
        incentiveAmount = _incentiveAmount;
        emit IncentiveUpdate(0, _incentiveAmount);
    }

    /// @notice set the incentiveAmount
    function setIncentiveAmount(uint256 newIncentiveAmount) public onlyGovernor {
        uint256 oldIncentiveAmount = incentiveAmount;
        incentiveAmount = newIncentiveAmount;
        emit IncentiveUpdate(oldIncentiveAmount, newIncentiveAmount);
    }

    /// @notice incentivize a call with incentiveAmount FEI rewards
    /// @dev no-op if the contract does not have Minter role
    function _incentivize() internal ifMinterSelf {
        _mintFei(msg.sender, incentiveAmount);
    }
}
