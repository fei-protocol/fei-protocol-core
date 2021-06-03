// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../refs/CoreRef.sol";

/// @title abstract contract for incentivizing keepers
/// @author Fei Protocol
abstract contract Incentivized is CoreRef {

    /// @notice FEI incentive for calling keeper functions
    uint256 public incentiveAmount;

    event IncentiveUpdate(uint256 _incentiveAmount);

    constructor(uint256 _incentiveAmount) {
        incentiveAmount = _incentiveAmount;
        emit IncentiveUpdate(_incentiveAmount);
    }

    /// @notice set the incentiveAmount
    function setIncentiveAmount(uint256 _incentiveAmount) public onlyGovernor {
        incentiveAmount = _incentiveAmount;
        emit IncentiveUpdate(_incentiveAmount);
    }

    /// @notice incentivize a call with {swapIncentiveAmount} FEI rewards
    function _incentivize() internal ifMinterSelf {
        fei().mint(msg.sender, incentiveAmount);
    }
}
