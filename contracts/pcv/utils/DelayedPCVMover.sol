// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../../refs/CoreRef.sol";
import "./RatioPCVControllerV2.sol";

/// @title a PCV controller for moving a ratio of the total value in the PCV deposit
/// @author Fei Protocol
contract DelayedPCVMover is CoreRef {
    using SafeERC20 for IERC20;

    /// @notice deadline to wait before PCV movement.
    uint256 public deadline;
    /// @notice controller used to move PCV.
    RatioPCVControllerV2 public controller;
    /// @notice deposit to withdraw funds from.
    IPCVDeposit public deposit;
    /// @notice target to send funds to.
    address public target;
    /// @notice basis points for the ratio of funds to move.
    uint256 public basisPoints;

    /// @notice DelayedPCVMover constructor
    /// @param _core Fei Core for reference
    /// @param _deadline to wait before PCV movement
    /// @param _controller used for moving funds
    /// @param _deposit used to withdraw funds from
    /// @param _target to send funds to
    /// @param _basisPoints used to know what ratio of funds to move
    constructor(
        address _core,
        uint256 _deadline,
        RatioPCVControllerV2 _controller,
        IPCVDeposit _deposit,
        address _target,
        uint256 _basisPoints
    ) CoreRef(_core) {
        deadline = _deadline;
        controller = _controller;
        deposit = _deposit;
        target = _target;
        basisPoints = _basisPoints;
    }

    /// @notice Modifier for PCV movement functions. This will enforce the
    /// deadline check, and renounce to the PCV_CONTROLLER_ROLE role after
    /// a successful call.
    modifier pcvMovement() {
        // Check that deadline has been reached
        require(block.timestamp >= deadline, "DelayedPCVMover: deadline not reached");

        // Perform PCV movement
        _;

        // Revoke PCV_CONTROLLER_ROLE from self
        core().renounceRole(keccak256("PCV_CONTROLLER_ROLE"), address(this));
    }

    /// @notice PCV movement by calling withdrawRatio on the PCVController.
    function withdrawRatio() public whenNotPaused pcvMovement {
        controller.withdrawRatio(deposit, target, basisPoints);
    }
}
