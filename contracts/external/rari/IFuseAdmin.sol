// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

interface IFuseAdmin {
    function _editCErc20DelegateWhitelist(address[] memory oldImplementations, address[] memory newImplementations, bool[] memory allowResign, bool[] memory statuses) external;
}