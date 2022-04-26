// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./QuadraticTokenTimelock.sol";

interface IVotingToken is IERC20 {
    function delegate(address delegatee) external;
}

/// @title a timelock for tokens allowing for bulk delegation
/// @author Fei Protocol
/// @notice allows the timelocked tokens to be delegated by the beneficiary while locked
contract QuadraticTimelockedDelegator is QuadraticTokenTimelock {
    /// @notice QuadraticTimelockedDelegator constructor
    /// @param _token the token address
    /// @param _beneficiary admin, and timelock beneficiary
    /// @param _duration duration of the token timelock window
    /// @param _cliff the seconds before first claim is allowed
    /// @param _clawbackAdmin the address which can trigger a clawback
    /// @param _startTime the unix epoch for starting timelock. Use 0 to start at deployment
    constructor(
        address _token,
        address _beneficiary,
        uint256 _duration,
        uint256 _cliff,
        address _clawbackAdmin,
        uint256 _startTime
    ) QuadraticTokenTimelock(_beneficiary, _duration, _token, _cliff, _clawbackAdmin, _startTime) {}

    /// @notice accept beneficiary role over timelocked TRIBE
    function acceptBeneficiary() public override {
        _setBeneficiary(msg.sender);
    }

    /// @notice delegate all held TRIBE to the `to` address
    function delegate(address to) public onlyBeneficiary {
        IVotingToken(address(lockedToken)).delegate(to);
    }
}
