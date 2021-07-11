// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

abstract contract CErc20Delegator {
    address public admin;
    address public pendingAdmin;
    function _setPendingAdmin(address payable newPendingAdmin) external virtual returns (uint);
    function _acceptAdmin() external virtual returns (uint);
    function mint(uint mintAmount) external virtual returns (uint);
    function balanceOf(address account) public view virtual returns (uint256);
}