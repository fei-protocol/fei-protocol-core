// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../IPCVDeposit.sol";

/// @title a PCV dripping controller interface
/// @author Fei Protocol
interface IPCVDripController {
    // ----------- Events -----------

    event SourceUpdate(address indexed oldSource, address indexed newSource);
    event TargetUpdate(address indexed oldTarget, address indexed newTarget);
    event DripAmountUpdate(uint256 oldDripAmount, uint256 newDripAmount);
    event Dripped(
        address indexed source,
        address indexed target,
        uint256 amount
    );

    // ----------- Governor only state changing api -----------

    function setSource(IPCVDeposit newSource) external;

    function setTarget(IPCVDeposit newTarget) external;

    function setDripAmount(uint256 newDripAmount) external;

    // ----------- Public state changing api -----------

    function drip() external;

    // ----------- Getters -----------

    function source() external view returns (IPCVDeposit);

    function target() external view returns (IPCVDeposit);

    function dripAmount() external view returns (uint256);

    function dripEligible() external view returns (bool);
}
