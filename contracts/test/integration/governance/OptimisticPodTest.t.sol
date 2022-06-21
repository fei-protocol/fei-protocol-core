// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {MemberToken} from "@orcaprotocol/contracts/contracts/MemberToken.sol";
import {ControllerV1} from "@orcaprotocol/contracts/contracts/ControllerV1.sol";
import {IGnosisSafe} from "../../../pods/interfaces/IGnosisSafe.sol";

import {createPod, setupTimelock, mintOrcaTokens} from "../fixtures/Orca.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";
import {Vm} from "../../utils/Vm.sol";
import {DSTest} from "../../utils/DSTest.sol";

/// @dev Tests for the optimistic governance pod unit. This is composed of an
/// Orca pod and an optimistic timelock. Key agents involved are:
/// - Orca pod: a Gnosis Safe with a membership wrapper.
///             It is the Gnosis safe from which transactions are sent to
///             the optimistic timelock
/// - Optimistic timelock: a timelock from which transactions are sent to the protocol
contract OptimisticPodIntegrationTest is DSTest {
    Vm public constant vm = Vm(HEVM_ADDRESS);

    MemberToken memberToken = MemberToken(MainnetAddresses.MEMBER_TOKEN);

    ControllerV1 controller = ControllerV1(MainnetAddresses.ORCA_POD_CONTROLLER_V1_2);

    address proposer = address(0x1);
    address executor = address(0x2);
    address podAdmin = address(0x3);

    address member1 = address(0x4);
    address member2 = address(0x5);
    address member3 = address(0x6);

    uint256 podId;
    uint256 numPodMembers;

    function setUp() public {
        mintOrcaTokens(address(this), 1, vm);

        // Note: Gnosis safe creation fails if < 3 members
        address[] memory members = new address[](3);
        members[0] = member1;
        members[1] = member2;
        members[2] = member3;

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
    function testLinkTimelockController() public {
        address safeAddress = controller.podIdToSafe(podId);
        TimelockController timelock = setupTimelock(safeAddress, safeAddress, MainnetAddresses.CORE);

        // Be able to call propose via pod/safe. This verifies that the safe has onlyPropose role
        vm.prank(safeAddress);
        timelock.schedule(address(0x10), 5, "", bytes32("testing"), bytes32("random"), 0);
    }

    /// @notice Validate that a member can be removed from a pod by the admin
    /// Note: Orca sets the memberTokenID to be the podId
    function testRemovePodMember() public {
        address safeAddress = controller.podIdToSafe(podId);
        assertEq(IGnosisSafe(safeAddress).getOwners().length, numPodMembers);

        // PodAdmin removes a member. This simulates the DAO removing a Tribal Council member
        vm.prank(podAdmin);
        memberToken.burn(member1, podId);

        // Validate membership removed
        uint256 hasMemberToken = memberToken.balanceOf(member1, podId);
        assertEq(hasMemberToken, 0);

        // Validate not an owner of the safe
        address[] memory members = IGnosisSafe(safeAddress).getOwners();
        bool isOwner = IGnosisSafe(safeAddress).isOwner(member1);
        assertFalse(isOwner);
        assertEq(members.length, 2);
        assertEq(members[0], member2);
        assertEq(members[1], member3);
    }

    /// @notice Validate that a member can be added to a pod
    function testAddPodMember() public {
        address newMember = address(0x30);
        address safeAddress = controller.podIdToSafe(podId);

        // PodAdmin adds a new member
        vm.prank(podAdmin);
        memberToken.mint(newMember, podId, bytes(""));

        // Validate membership added
        uint256 hasMemberToken = memberToken.balanceOf(member1, podId);
        assertEq(hasMemberToken, 1);

        // Validate member is a Safe Owner
        address[] memory members = IGnosisSafe(safeAddress).getOwners();
        bool isOwner = IGnosisSafe(safeAddress).isOwner(newMember);
        assertTrue(isOwner);
        assertEq(members.length, numPodMembers + 1);
        assertEq(members[0], newMember);
        assertEq(members[1], member1);
        assertEq(members[2], member2);
        assertEq(members[3], member3);
    }

    /// @notice Validate that add pod member is permissioned
    function testAddPodMemberPermissioned() public {
        address newMember = address(0x30);

        vm.expectRevert(bytes("No Rules Set"));
        memberToken.mint(newMember, podId, bytes(""));
    }
}
