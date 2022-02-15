// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./FixedQuadraticTokenTimelockUpgradeable.sol";

interface IVotingToken is IERC20 {
    function delegate(address delegatee) external;
}

/// @title a timelock for tokens allowing for bulk delegation
/// @author Fei Protocol
/// @notice allows the timelocked tokens to be delegated by the beneficiary while locked
contract FixedQuadraticTimelockedDelegatorUpgradeable is FixedQuadraticTokenTimelockUpgradeable {
    /// @notice accept beneficiary role over timelocked TRIBE
    function acceptBeneficiary() public override {
        _setBeneficiary(msg.sender);
    }

    /// @notice delegate all held TRIBE to the `to` address
    function delegate(address to) public onlyBeneficiary {
        IVotingToken(address(lockedToken)).delegate(to);
    }
}
