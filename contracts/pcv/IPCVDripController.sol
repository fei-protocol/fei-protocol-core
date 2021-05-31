// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./IPCVDeposit.sol";

/// @title a PCV dripping controller interface
/// @author Fei Protocol
interface IPCVDripController {
    // ----------- Events -----------

    event SourceUpdate (address indexed source);
    event TargetUpdate (address indexed target);
    event DripAmountUpdate (uint256 dripAmount);
    event Dripped (address indexed source, address indexed target, uint256 amount);

    // ----------- Governor only state changing api -----------

    function setSource(IPCVDeposit _source) external;

    function setTarget(IPCVDeposit _target) external;

    function setDripAmount(uint256 _dripAmount) external;

    // ----------- Public state changing api -----------

    function drip() external;

    // ----------- Getters -----------

    function source() external view returns (IPCVDeposit);

    function target() external view returns (IPCVDeposit);

    function dripAmount() external view returns (uint256);

    function dripEligible() external view returns (bool);
}

