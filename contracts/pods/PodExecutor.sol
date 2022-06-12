// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {CoreRef} from "../refs/CoreRef.sol";

/// @title PodExecutor
/// @notice Executor gateway contract which exposes the execution of prepared timelock transactions and makes them public
/// @dev EXECUTOR_ROLE must be granted to this contract by the relevant timelock, in order for this contract to execute
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
        bytes32 proposalId = TimelockController(payable(timelock)).hashOperation(
            target,
            value,
            data,
            predecessor,
            salt
        );
        TimelockController(payable(timelock)).execute(target, value, data, predecessor, salt);
        emit ExecuteTransaction(timelock, proposalId);
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
