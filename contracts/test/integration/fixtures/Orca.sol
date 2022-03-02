// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {IMemberToken} from "../../../pods/interfaces/IMemberToken.sol";
import {IControllerV1} from "../../../pods/interfaces/IControllerV1.sol";
import {OptimisticTimelock} from "../../../dao/timelock/OptimisticTimelock.sol";
import "hardhat/console.sol";

function createPod(
    IControllerV1 controller,
    IMemberToken memberToken,
    address[] memory members,
    address podAdmin
) returns (uint256) {
    // Number of members required to sign a transaction
    uint256 threshold = 2;
    bytes32 podLabel = bytes32("hellopod");
    string memory ensString = "hellopod.eth";
    string memory imageUrl = "hellopod.come";

    // Get the next podId
    uint256 expectedPodId = memberToken.getNextAvailablePodId();
    console.log("expected pod Id: ", expectedPodId);

    controller.createPod(
        members,
        threshold,
        podAdmin,
        podLabel,
        ensString,
        expectedPodId,
        imageUrl
    );
    return expectedPodId;
}

function setupOptimisticTimelock(
    address proposer,
    address executor,
    address core
) returns (OptimisticTimelock) {
    address[] memory proposers = new address[](1);
    proposers[0] = proposer;

    address[] memory executors = new address[](1);
    executors[0] = executor;
    OptimisticTimelock timelock = new OptimisticTimelock(
        core,
        0,
        proposers,
        executors
    );
    return timelock;
}
