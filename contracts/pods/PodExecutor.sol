// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {CoreRef} from "../refs/CoreRef.sol";

/// @title PodExecutor
/// @notice Executor gateway contract which exposes the execution of prepared timelock transactions and makes them public
/// @dev EXECUTOR_ROLE must be granted to this contract by the relevant timelock, in order for this contract to execute
contract PodExecutor is CoreRef {
    event ExecuteTransaction(address timelock, bytes32 proposalId);

    constructor(address _core) CoreRef(_core) {}

    /// @notice Execute a timelock transaction. Must have EXECUTOR_ROLE on the appropriate timelock
    function execute(
        address timelock,
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) public payable whenNotPaused returns (bytes32) {
        bytes32 proposalId = TimelockController(payable(timelock)).hashOperation(
            target,
            value,
            data,
            predecessor,
            salt
        );
        TimelockController(payable(timelock)).execute(target, value, data, predecessor, salt);
        emit ExecuteTransaction(timelock, proposalId);
        return proposalId;
    }

    /// @notice Execute a transaction which contains a set of actions which were batch scheduled on a timelock
    function executeBatch(
        address timelock,
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata payloads,
        bytes32 predecessor,
        bytes32 salt
    ) external payable whenNotPaused returns (bytes32) {
        bytes32 proposalId = TimelockController(payable(timelock)).hashOperationBatch(
            targets,
            values,
            payloads,
            predecessor,
            salt
        );
        TimelockController(payable(timelock)).executeBatch(targets, values, payloads, predecessor, salt);
        emit ExecuteTransaction(timelock, proposalId);
        return proposalId;
    }
}
