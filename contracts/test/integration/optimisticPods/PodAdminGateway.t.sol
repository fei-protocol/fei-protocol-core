// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {Vm} from "../../utils/Vm.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {PodFactory} from "../../../pods/PodFactory.sol";
import {PodAdminGateway} from "../../../pods/PodAdminGateway.sol";
import {IPodAdminGateway} from "../../../pods/IPodAdminGateway.sol";
import {mintOrcaTokens, getPodParams} from "../fixtures/Orca.sol";
import {IPodFactory} from "../../../pods/IPodFactory.sol";
import {TribeRoles} from "../../../core/TribeRoles.sol";
import {ICore} from "../../../core/ICore.sol";

contract PodAdminGatewayIntegrationTest is DSTest {
    Vm public constant vm = Vm(HEVM_ADDRESS);

    PodFactory factory;
    PodAdminGateway podAdminGateway;
    IPodFactory.PodConfig podConfig;
    uint256 podId;
    address votiumAddress;
    bytes32 testRole;

    address private core = 0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9;
    address private podController = 0xD89AAd5348A34E440E72f5F596De4fA7e291A3e8;
    address private memberToken = 0x0762aA185b6ed2dCA77945Ebe92De705e0C37AE3;
    address private feiDAOTimelock = 0xd51dbA7a94e1adEa403553A8235C302cEbF41a3c;
    address private securityGuardian =
        0xB8f482539F2d3Ae2C9ea6076894df36D1f632775;
    address private podExecutor = address(0x500);

    function setUp() public {
        // 1.0 Deploy pod factory
        factory = new PodFactory(core, podController, memberToken, podExecutor);

        // 2.0 Deploy multi-pod admin contract, to expose pod admin functionality
        podAdminGateway = new PodAdminGateway(core, memberToken);

        // 3.0 Make config for pod, mint Orca tokens to factory
        IPodFactory.PodConfig memory config = getPodParams(
            address(podAdminGateway),
            address(0x20)
        );
        podConfig = config;
        mintOrcaTokens(address(factory), 2, vm);

        // 4.0 Create pod
        vm.prank(feiDAOTimelock);
        (podId, ) = factory.createChildOptimisticPod(podConfig);

        // 5.0 Grant a test role admin access
        testRole = TribeRoles.VOTIUM_ROLE;
        votiumAddress = address(0x11);

        vm.prank(feiDAOTimelock);
        ICore(core).grantRole(testRole, votiumAddress);
    }

    /// @notice Validate that podAdminGateway contract pod admin, and initial state is valid
    function testInitialState() public {
        address podAdmin = factory.getPodAdmin(podId);
        assertEq(podAdmin, address(podAdminGateway));

        bytes32[] memory allPodAdmins = podAdminGateway.getPodAdminPriviledges(
            podId,
            IPodAdminGateway.AdminPriviledge.ADD_MEMBER
        );
        assertEq(allPodAdmins.length, 0);

        // Grant a TribeRole pod admin status to pod
        vm.prank(feiDAOTimelock);
        podAdminGateway.grantPodAdminPriviledge(
            podId,
            IPodAdminGateway.AdminPriviledge.ADD_MEMBER,
            TribeRoles.VOTIUM_ROLE
        );
        bytes32[] memory updatedAdminRoles = podAdminGateway
            .getPodAdminPriviledges(
                podId,
                IPodAdminGateway.AdminPriviledge.ADD_MEMBER
            );
        assertEq(updatedAdminRoles[0], TribeRoles.VOTIUM_ROLE);
    }

    /// @notice Validate that a podAdmin can be added for a particular pod
    function testAddPodAdmin() public {
        bytes32 extraRole = TribeRoles.VOTIUM_ROLE;

        vm.prank(feiDAOTimelock);
        podAdminGateway.grantPodAdminPriviledge(
            podId,
            IPodAdminGateway.AdminPriviledge.ADD_MEMBER,
            extraRole
        );

        bytes32[] memory allPodAdmins = podAdminGateway.getPodAdminPriviledges(
            podId,
            IPodAdminGateway.AdminPriviledge.ADD_MEMBER
        );
        assertEq(allPodAdmins.length, 1);
        assertEq(allPodAdmins[0], extraRole);
    }

    /// @notice Validate that a podAdmin can be removed for a particular pod
    function testRemovePodAdmin() public {
        // Grant a role admin access
        vm.prank(feiDAOTimelock);
        podAdminGateway.grantPodAdminPriviledge(
            podId,
            IPodAdminGateway.AdminPriviledge.REMOVE_MEMBER,
            testRole
        );

        // Revoke that role admin access
        vm.prank(securityGuardian);
        podAdminGateway.revokePodAdminPriviledge(
            podId,
            IPodAdminGateway.AdminPriviledge.REMOVE_MEMBER,
            testRole
        );

        bytes32[] memory allPodAdmins = podAdminGateway.getPodAdminPriviledges(
            podId,
            IPodAdminGateway.AdminPriviledge.REMOVE_MEMBER
        );
        assertEq(allPodAdmins.length, 0);
    }

    /// @notice Validate that an added podAdmin has access to admin functionality for a pod
    function testPodAdminCanAddMembers() public {
        // Grant Votium address admin access to pod
        vm.prank(feiDAOTimelock);
        podAdminGateway.grantPodAdminPriviledge(
            podId,
            IPodAdminGateway.AdminPriviledge.ADD_MEMBER,
            testRole
        );

        // Have Votium address add new member to pod
        address newPodMember = address(0x12);
        vm.prank(votiumAddress);
        podAdminGateway.addMemberToPod(podId, newPodMember);

        // Validate membership added
        uint256 numMembers = factory.getNumMembers(podId);
        uint256 initialNumMembers = podConfig.members.length;
        assertEq(numMembers, initialNumMembers + 1);

        address[] memory members = factory.getPodMembers(podId);
        assertEq(members[0], newPodMember);
    }

    function testPodAdminCanRemoveMembers() public {
        vm.prank(feiDAOTimelock);
        podAdminGateway.grantPodAdminPriviledge(
            podId,
            IPodAdminGateway.AdminPriviledge.REMOVE_MEMBER,
            testRole
        );

        // Remove member from pod
        address podMemberToRemove = factory.getPodMembers(podId)[0];
        vm.prank(votiumAddress);
        podAdminGateway.removeMemberFromPod(podId, podMemberToRemove);

        // Validate membership added
        uint256 numMembers = factory.getNumMembers(podId);
        uint256 initialNumMembers = podConfig.members.length;
        assertEq(numMembers, initialNumMembers - 1);
    }

    /// @notice Validate that a role with ADD_MEMBER access can not remove a member
    function testFailAdminDelineation() public {
        vm.prank(feiDAOTimelock);
        podAdminGateway.grantPodAdminPriviledge(
            podId,
            IPodAdminGateway.AdminPriviledge.ADD_MEMBER,
            testRole
        );

        // Remove member from pod
        address podMemberToRemove = factory.getPodMembers(podId)[0];
        vm.prank(votiumAddress);
        podAdminGateway.removeMemberFromPod(podId, podMemberToRemove);
    }

    /// @notice Validate that a role can have both ADD_MEMBER and REMOVE_MEMBER access
    function validateMultiplAdminRoles() public {
        vm.prank(feiDAOTimelock);
        podAdminGateway.grantPodAdminPriviledge(
            podId,
            IPodAdminGateway.AdminPriviledge.ADD_MEMBER,
            testRole
        );
        podAdminGateway.grantPodAdminPriviledge(
            podId,
            IPodAdminGateway.AdminPriviledge.REMOVE_MEMBER,
            testRole
        );

        bytes32[] memory addMemberTribeRoles = podAdminGateway
            .getPodAdminPriviledges(
                podId,
                IPodAdminGateway.AdminPriviledge.ADD_MEMBER
            );
        assertEq(addMemberTribeRoles.length, 1);
        assertEq(addMemberTribeRoles[0], testRole);

        bytes32[] memory removeMemberTribeRoles = podAdminGateway
            .getPodAdminPriviledges(
                podId,
                IPodAdminGateway.AdminPriviledge.REMOVE_MEMBER
            );
        assertEq(removeMemberTribeRoles.length, 1);
        assertEq(removeMemberTribeRoles[0], testRole);
    }

    /// @notice Validate that a non-PodAdmin fails to call a priviledged admin method
    function testFailNonAdminRemoveMember() public {
        vm.expectRevert(bytes("UnauthorisedAdminAction"));
        podAdminGateway.removeMemberFromPod(podId, address(0x1));
    }
}
