// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

interface IOptimisticTimelock {
    function becomeAdmin() external;

    function hasRole(bytes32 role, address account)
        external
        view
        returns (bool);
}
