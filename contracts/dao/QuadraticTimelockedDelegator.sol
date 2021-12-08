// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../utils/timelock/QuadraticTokenTimelock.sol";

interface IVotingToken is IERC20 {
    function delegate(address delegatee) external;
}

/// @title a timelock for tokens allowing for sub-delegation
/// @author Fei Protocol
/// @notice allows the timelocked tokens to be delegated by the beneficiary while locked
contract QuadraticTimelockedDelegator is QuadraticTokenTimelock {
    /// @notice QuadraticTimelockedDelegator constructor
    /// @param _token the token address
    /// @param _beneficiary default delegate, admin, and timelock beneficiary
    /// @param _duration duration of the token timelock window
    constructor(
        address _token,
        address _beneficiary,
        uint256 _duration
    ) QuadraticTokenTimelock(_beneficiary, _duration, _token) {
        IVotingToken(address(_token)).delegate(_beneficiary);
    }

    /// @notice accept beneficiary role over timelocked TRIBE. Delegates all held (non-subdelegated) tribe to beneficiary
    function acceptBeneficiary() public override {
        _setBeneficiary(msg.sender);
        IVotingToken(address(lockedToken)).delegate(msg.sender);
    }
}
