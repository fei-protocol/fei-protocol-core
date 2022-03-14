// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {IMemberToken} from "../../../pods/orcaInterfaces/IMemberToken.sol";
import {IControllerV1} from "../../../pods/orcaInterfaces/IControllerV1.sol";
import {IInviteToken} from "../../../pods/orcaInterfaces/IInviteToken.sol";
import {IPodFactory} from "../../../pods/IPodFactory.sol";
import {OptimisticTimelock} from "../../../dao/timelock/OptimisticTimelock.sol";
import {Vm} from "../../utils/Vm.sol";
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

/// @notice Mint SHIP tokens to an address. SHIP tokens required to deploy
///         Orca pods in beta release
function mintOrcaTokens(
    address to,
    uint256 amount,
    Vm vm
) {
    address shipToken = 0x872EdeaD0c56930777A82978d4D7deAE3A2d1539;
    address priviledgedShip = 0x2149A222feD42fefc3A120B3DdA34482190fC666;

    IInviteToken inviteToken = IInviteToken(shipToken);

    vm.prank(priviledgedShip);
    inviteToken.mint(to, amount);
}

function getPodParams(address admin)
    pure
    returns (IPodFactory.PodConfig memory, uint256)
{
    uint256 threshold = 2;
    bytes32 label = bytes32("hellopod");
    string memory ensString = "hellopod.eth";
    string memory imageUrl = "hellopod.com";
    uint256 minDelay = 0;

    address[] memory members = new address[](3);
    members[0] = address(0x4);
    members[1] = address(0x5);
    members[2] = address(0x6);

    IPodFactory.PodConfig memory config = IPodFactory.PodConfig({
        members: members,
        threshold: threshold,
        label: label,
        ensString: ensString,
        imageUrl: imageUrl,
        minDelay: minDelay,
        admin: admin
    });
    return (config, minDelay);
}
