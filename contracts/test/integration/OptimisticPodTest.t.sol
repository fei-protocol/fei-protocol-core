// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {IGnosisSafe} from "@orcaprotocol/contracts/contracts/interfaces/IGnosisSafe.sol";
import {OptimisticTimelock} from "../../dao/timelock/OptimisticTimelock.sol";
import {IControllerV1} from "../../pods/interfaces/IControllerV1.sol";
import {IMemberToken} from "../../pods/interfaces/IMemberToken.sol";
import {IInviteToken} from "../../pods/interfaces/IInviteToken.sol";

import {createPod, setupOptimisticTimelock} from "./fixtures/Orca.sol";
import {Vm} from "../utils/Vm.sol";
import {DSTest} from "../utils/DSTest.sol";
import "hardhat/console.sol";

contract OptimisticPodTest is DSTest {
    Vm public constant vm = Vm(HEVM_ADDRESS);

    // Mainnet addresses
    address private core = 0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9;
    address private podControllerAddress =
        0xD89AAd5348A34E440E72f5F596De4fA7e291A3e8;
    address private memberTokenAddress =
        0x0762aA185b6ed2dCA77945Ebe92De705e0C37AE3;

    // Used in the Beta rollout to permission who can call the pod
    address private shipTokenAddress =
        0x872EdeaD0c56930777A82978d4D7deAE3A2d1539;
    address private priviledgedShipAddress =
        0x2149A222feD42fefc3A120B3DdA34482190fC666;

    IMemberToken memberToken = IMemberToken(memberTokenAddress);

    IControllerV1 controller = IControllerV1(podControllerAddress);
    IInviteToken inviteToken = IInviteToken(shipTokenAddress);

    address proposer = address(0x1);
    address executor = address(0x2);
    address podAdmin = address(0x3);

    // vm.label(address(memberTokenAddress), "Member token");
    // vm.label(address(podControllerAddress), "Controller");

    uint256 podId;
    uint256 numPodMembers;

    function setUp() public {
        // Mint SHIP to self - needed to create a Pod
        vm.prank(priviledgedShipAddress);
        inviteToken.mint(address(this), 1);

        // Note: Gnosis safe creation fails if < 3 members
        address[] memory members = new address[](3);
        members[0] = address(0x4);
        members[1] = address(0x5);
        members[2] = address(0x6);

        numPodMembers = members.length;

        podId = createPod(controller, memberToken, members, podAdmin);
    }

    /// @notice Validate that a pod can be created
    function testCreatePod() public {
        address safeAddress = controller.podIdToSafe(podId);
        assert(safeAddress != address(0));

        // Validate membership
        address[] memory members = IGnosisSafe(safeAddress).getOwners();
        assertEq(members.length, 3);

        address setPodAdmin = controller.podAdmin(podId);
        assertEq(setPodAdmin, podAdmin);
    }

    /// @notice Verify that the pod is set as the proposer and can propose on the timelock
    function testLinkOptimisticTimelock() public {
        address safeAddress = controller.podIdToSafe(podId);
        OptimisticTimelock timelock = setupOptimisticTimelock(
            safeAddress,
            safeAddress,
            core
        );

        // Be able to call propose via pod/safe. Verify that safe has onlyPropose role
        vm.prank(safeAddress);
        timelock.schedule(
            address(0x10),
            5,
            "",
            bytes32("testing"),
            bytes32("random"),
            0
        );
    }

    /// @notice Validate that a member can be removed from a pod by the admin
    function testRemovePodMember() public {
        address safeAddress = controller.podIdToSafe(podId);

        // Compromised member transfers their membership to an illegal member
        address illegalMember = address(0x20);
        // Note: Orca sets the memberTokenID to be the podId

        // TODO: Fails for unknown reasons
        vm.prank(podAdmin);
        memberToken.burn(illegalMember, podId);

        // TODO: Validate membership removed the and can not vote
    }
}
