// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {ITimelock} from "../dao/timelock/ITimelock.sol";

/// @title PodExecutor
/// @notice Executor gateway contract that allows any address to execute prepared timelock transactions
/// @dev Access is granted to this contract to execute transactions on a timelock
contract PodExecutor {
    function execute(
        address timelock,
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) external payable {
        ITimelock(timelock).execute(target, value, data, predecessor, salt);
    }
}
