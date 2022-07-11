// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {MemberToken} from "@orcaprotocol/contracts/contracts/MemberToken.sol";
import {ControllerV1} from "@orcaprotocol/contracts/contracts/ControllerV1.sol";
import {InviteToken} from "@orcaprotocol/contracts/contracts/InviteToken.sol";
import {IPodFactory} from "../../../pods/interfaces/IPodFactory.sol";
import {PodFactory} from "../../../pods/PodFactory.sol";
import {Vm} from "../../utils/Vm.sol";
import {PodAdminGateway} from "../../../pods/PodAdminGateway.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";
import {TribeRoles} from "../../../core/TribeRoles.sol";
import {Core} from "../../../core/Core.sol";

function createPod(
    ControllerV1 controller,
    MemberToken memberToken,
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

    controller.createPod(members, threshold, podAdmin, podLabel, ensString, expectedPodId, imageUrl);
    return expectedPodId;
}

function setupTimelock(
    address proposer,
    address executor,
    address /* core*/
) returns (TimelockController) {
    address[] memory proposers = new address[](1);
    proposers[0] = proposer;

    address[] memory executors = new address[](1);
    executors[0] = executor;
    TimelockController timelock = new TimelockController(0, proposers, executors);
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

    InviteToken inviteToken = InviteToken(shipToken);

    vm.prank(priviledgedShip);
    inviteToken.mint(to, amount);
}

/// @notice Pod with a timelock
function getPodParamsWithTimelock(address podAdmin) pure returns (IPodFactory.PodConfig memory) {
    bytes32 label = bytes32("hellopod");
    uint256 minDelay = 2 days;
    return getBasePodParams(label, minDelay, podAdmin);
}

/// @notice Pod without a timelock, minDelay is set to 0
function getPodParamsWithNoTimelock(address podAdmin) pure returns (IPodFactory.PodConfig memory) {
    bytes32 label = bytes32("hellopod");
    uint256 minDelay = 0;
    return getBasePodParams(label, minDelay, podAdmin);
}

/// @notice Genesis pod, the TribalCouncil, with a timelock
function getCouncilPodParams(address podAdmin) pure returns (IPodFactory.PodConfig memory) {
    bytes32 label = bytes32("tribalcouncil");
    uint256 minDelay = 2 days;
    return getBasePodParams(label, minDelay, podAdmin);
}

function getBasePodParams(
    bytes32 label,
    uint256 minDelay,
    address podAdmin
) pure returns (IPodFactory.PodConfig memory) {
    uint256 threshold = 1;
    string memory ensString = "hellopod.eth";
    string memory imageUrl = "hellopod.com";

    address[] memory members = new address[](3);
    members[0] = address(0x201);
    members[1] = address(0x202);
    members[2] = address(0x203);

    IPodFactory.PodConfig memory config = IPodFactory.PodConfig({
        members: members,
        threshold: threshold,
        label: label,
        ensString: ensString,
        imageUrl: imageUrl,
        admin: podAdmin,
        minDelay: minDelay
    });
    return config;
}

/// @dev Deploy pod factory and use to create a pod
function deployPodWithSystem(
    address core,
    address podController,
    address memberToken,
    address podExecutor,
    address podDeployer, // must be GOVERNOR or have POD_ADMIN role
    Vm vm
)
    returns (
        uint256,
        address,
        address,
        address,
        address,
        IPodFactory.PodConfig memory
    )
{
    // 1. Deploy PodFactory
    PodFactory factory = new PodFactory(core, memberToken, podController, podExecutor);
    mintOrcaTokens(address(factory), 2, vm);

    // 2. Deploy PodAdminGateway
    PodAdminGateway podAdminGateway = new PodAdminGateway(MainnetAddresses.CORE, memberToken, address(factory));
    IPodFactory.PodConfig memory podConfig = getPodParamsWithTimelock(address(podAdminGateway));

    // Grant POD_ADMIN role to factory
    vm.startPrank(MainnetAddresses.FEI_DAO_TIMELOCK);
    Core(core).createRole(TribeRoles.POD_ADMIN, TribeRoles.GOVERNOR);
    Core(core).grantRole(TribeRoles.POD_ADMIN, address(factory));
    vm.stopPrank();

    vm.deal(address(factory), 1000 ether);
    vm.prank(podDeployer);
    (uint256 podId, address podTimelock, address safe) = factory.createOptimisticPod(podConfig);

    return (podId, podTimelock, safe, address(factory), address(podAdminGateway), podConfig);
}
