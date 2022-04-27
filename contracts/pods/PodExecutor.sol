// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {ITimelock} from "../dao/timelock/ITimelock.sol";
import {CoreRef} from "../refs/CoreRef.sol";

/// @title PodExecutor
/// @notice Executor gateway contract that allows any address to execute prepared timelock transactions
/// @dev Access is granted to this contract to execute transactions on a timelock
contract PodExecutor is CoreRef {
    event ExecuteTransaction(address timelock, bytes32 dataHash);

    constructor(address _core) CoreRef(_core) {}

    /// @notice Execute a timelock transaction. Must have EXECUTOR_ROLE on the appropriate timelock
    function execute(
        address timelock,
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) public payable whenNotPaused {
        bytes32 dataPayloadHash = keccak256(data);
        ITimelock(timelock).execute(target, value, data, predecessor, salt);
        emit ExecuteTransaction(timelock, dataPayloadHash);
    }

    /// @notice Batch execute transactions on a set of timelocks. Must have EXECUTE_ROLE on the appropriate timelocks
    function executeBatch(
        address[] memory timelock,
        address[] memory target,
        uint256[] memory value,
        bytes[] calldata data,
        bytes32[] memory predecessor,
        bytes32[] memory salt
    ) external payable whenNotPaused {
        for (uint256 i = 0; i < timelock.length; i += 1) {
            execute(timelock[i], target[i], value[i], data[i], predecessor[i], salt[i]);
        }
    }
}
