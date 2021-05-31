// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./IPCVDripController.sol"; 
import "../refs/CoreRef.sol";
import "../utils/Timed.sol";

/// @title a PCV dripping controller
/// @author Fei Protocol
contract PCVDripController is IPCVDripController, CoreRef, Timed {
 
    /// @notice source PCV deposit to withdraw from
    IPCVDeposit public override source;

    /// @notice target address to drip to
    IPCVDeposit public override target;

    /// @notice amount to drip after each window
    uint256 public override dripAmount;

    /// @notice ETH PCV Dripper constructor
    /// @param _core Fei Core for reference
    /// @param _source the PCV deposit to drip from
    /// @param _target the PCV deposit to drip to
    /// @param _frequency frequency of dripping
    /// @param _dripAmount amount to drip on each drip
    constructor(
        address _core,
        IPCVDeposit _source,
        IPCVDeposit _target,
        uint256 _frequency,
        uint256 _dripAmount
    ) CoreRef(_core) Timed(_frequency) {
        target = _target;
        source = _source;

        dripAmount = _dripAmount;

         // start timer
        _initTimed();
    }

    /// @notice drip ETH to target by withdrawing from source
    function drip()
        external
        override
        afterTime
        whenNotPaused
    {
        require(dripEligible(), "PCVDripController: not eligible");
        
        // reset timer
        _initTimed();

        // drip
        source.withdraw(address(target), dripAmount);
        target.deposit(); // trigger any deposit logic on the target
        emit Dripped(address(source), address(target), dripAmount);
    }

    /// @notice set the new PCV Deposit source
    function setSource(IPCVDeposit _source)
        external
        override
        onlyGovernor
    {
        source = _source;
        emit SourceUpdate(address(source));
    }

    /// @notice set the new PCV Deposit target
    function setTarget(IPCVDeposit _target)
        external
        override
        onlyGovernor
    {
        target = _target;
        emit TargetUpdate(address(target));
    }

    /// @notice set the new drip amount
    function setDripAmount(uint256 _dripAmount)
        external
        override
        onlyGovernor
    {
        dripAmount = _dripAmount;
        emit DripAmountUpdate(dripAmount);
    }

    /// @notice checks whether the target balance is less than the drip amount
    function dripEligible() public view virtual override returns(bool) {
        return target.balance() < dripAmount;
    }
}