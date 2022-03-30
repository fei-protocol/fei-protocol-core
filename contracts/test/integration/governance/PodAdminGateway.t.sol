// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {Vm} from "../../utils/Vm.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {PodFactory} from "../../../pods/PodFactory.sol";
import {PodAdminGateway} from "../../../pods/PodAdminGateway.sol";
import {IPodAdminGateway} from "../../../pods/IPodAdminGateway.sol";
import {mintOrcaTokens, getPodParams} from "../fixtures/Orca.sol";
import {IPodFactory} from "../../../pods/IPodFactory.sol";
import {IControllerV1} from "../../../pods/orcaInterfaces/IControllerV1.sol";
import {ITimelock} from "../../../dao/timelock/ITimelock.sol";
import {TribeRoles} from "../../../core/TribeRoles.sol";
import {ICore} from "../../../core/ICore.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";

contract PodAdminGatewayIntegrationTest is DSTest {
    Vm public constant vm = Vm(HEVM_ADDRESS);

    PodFactory factory;
    PodAdminGateway podAdminGateway;
    IPodFactory.PodConfig podConfig;
    uint256 podId;
    bytes32 testRole;
    address timelock;
    address safe;
    address private podExecutor = address(0x500);

    address core = MainnetAddresses.CORE;
    address memberToken = MainnetAddresses.MEMBER_TOKEN;
    address podController = MainnetAddresses.POD_CONTROLLER;
    address feiDAOTimelock = MainnetAddresses.FEI_DAO_TIMELOCK;

    function setUp() public {
        // 1.0 Deploy pod factory
        factory = new PodFactory(core, podController, memberToken, podExecutor);

        // 2.0 Deploy multi-pod admin contract, to expose pod admin functionality
        podAdminGateway = new PodAdminGateway(
            core,
            memberToken,
            address(factory)
        );

        // 3.0 Make config for pod, mint Orca tokens to factory
        IPodFactory.PodConfig memory config = getPodParams(
            address(podAdminGateway)
        );
        podConfig = config;
        mintOrcaTokens(address(factory), 2, vm);

        // 4.0 Create pod
        vm.prank(feiDAOTimelock);
        (podId, timelock, safe) = factory.createChildOptimisticPod(podConfig);
    }

    /// @notice Validate that podAdminGateway contract pod admin, and initial state is valid
    function testInitialState() public {
        address podAdmin = factory.getPodAdmin(podId);
        assertEq(podAdmin, address(podAdminGateway));

        // Validate VetoController has proposer role, this will allow it to veto
        ITimelock timelockContract = ITimelock(timelock);
        bool hasProposerRole = timelockContract.hasRole(
            keccak256("PROPOSER_ROLE"),
            address(address(podAdminGateway))
        );
        assertTrue(hasProposerRole);
    }

    /// @notice Validate that a podAdmin can be added for a particular pod by the GOVERNOR
    function testAddPodMember() public {
        address newMember = address(0x11);

        vm.prank(feiDAOTimelock);
        podAdminGateway.addPodMember(podId, newMember);
        uint256 numPodMembers = factory.getNumMembers(podId);
        assertEq(numPodMembers, podConfig.members.length + 1);
        address[] memory podMembers = factory.getPodMembers(podId);
        assertEq(podMembers[0], newMember);
    }

    /// @notice Validate that a podAdmin can be removed for a particular pod
    function testRemovePodMember() public {
        address memberToRemove = podConfig.members[0];

        vm.prank(feiDAOTimelock);
        podAdminGateway.removePodMember(podId, memberToRemove);

        uint256 numPodMembers = factory.getNumMembers(podId);
        assertEq(numPodMembers, podConfig.members.length - 1);

        address[] memory podMembers = factory.getPodMembers(podId);
        assertEq(podMembers[0], podConfig.members[1]);
        assertEq(podMembers[1], podConfig.members[2]);
    }

    /// @notice Validate that members can be removed by batch
    function testBatchRemoveMembers() public {
        address[] memory membersToRemove = new address[](2);
        membersToRemove[0] = podConfig.members[0];
        membersToRemove[1] = podConfig.members[1];

        vm.prank(feiDAOTimelock);
        podAdminGateway.batchRemovePodMember(podId, membersToRemove);

        uint256 numPodMembers = factory.getNumMembers(podId);
        assertEq(
            numPodMembers,
            podConfig.members.length - membersToRemove.length
        );

        // Should only be 1 podMember left - the last
        address[] memory podMembers = factory.getPodMembers(podId);
        assertEq(podMembers[0], podConfig.members[2]);
    }

    /// @notice Validate that members can be added by batch
    function testBatchAddMembers() public {
        address[] memory membersToAdd = new address[](2);
        membersToAdd[0] = address(0x11);
        membersToAdd[1] = address(0x12);

        vm.prank(feiDAOTimelock);
        podAdminGateway.batchAddPodMember(podId, membersToAdd);

        uint256 numPodMembers = factory.getNumMembers(podId);
        assertEq(numPodMembers, podConfig.members.length + membersToAdd.length);

        address[] memory podMembers = factory.getPodMembers(podId);
        assertEq(podMembers[0], membersToAdd[1]);
        assertEq(podMembers[1], membersToAdd[0]);
    }

    /// @notice Validate that a non-PodAdmin fails to call a priviledged admin method
    function testNonAdminFailsToRemoveMember() public {
        vm.expectRevert(bytes("UNAUTHORIZED"));
        podAdminGateway.removePodMember(podId, podConfig.members[0]);
    }

    /// @notice Validate that PodAddMemberRole is computed is expected
    function testGetPodAddMemberRole() public {
        bytes32 specificAddRole = keccak256(
            abi.encode(podId, "ORCA_POD", "POD_ADD_MEMBER_ROLE")
        );
        assertEq(specificAddRole, podAdminGateway.getPodAddMemberRole(podId));
    }

    /// @notice Validate that PoddVetoRole is computed is expected
    function testGetVetoRole() public {
        bytes32 specificVetoRole = keccak256(
            abi.encode(podId, "ORCA_POD", "POD_VETO_ROLE")
        );
        assertEq(specificVetoRole, podAdminGateway.getPodVetoRole(podId));
    }

    /// @notice Validate that specific admin transfer role is computed correctly
    function testGetTransferAdminRole() public {
        bytes32 specificTransferAdminRole = keccak256(
            abi.encode(podId, "ORCA_POD", "POD_TRANSFER_ADMIN_ROLE")
        );
        assertEq(
            specificTransferAdminRole,
            podAdminGateway.getPodTransferAdminRole(podId)
        );
    }

    /// @notice Validate that PodRemoveMemberRole is computed is expected
    function testRemovePodAddMemberRole() public {
        bytes32 specificRemoveRole = keccak256(
            abi.encode(podId, "ORCA_POD", "POD_REMOVE_MEMBER_ROLE")
        );
        assertEq(
            specificRemoveRole,
            podAdminGateway.getPodRemoveMemberRole(podId)
        );
    }

    /// @notice Validate that the specific add member pod admin can add
    function testSpecificAddMemberRole() public {
        address userWithSpecificRole = address(0x11);

        // Create role in core
        bytes32 specificPodAddRole = keccak256(
            abi.encode(podId, "ORCA_POD", "POD_ADD_MEMBER_ROLE")
        );

        vm.startPrank(feiDAOTimelock);
        ICore(core).createRole(specificPodAddRole, TribeRoles.GOVERNOR);
        ICore(core).grantRole(specificPodAddRole, userWithSpecificRole);
        vm.stopPrank();

        address newMember = address(0x12);
        vm.prank(userWithSpecificRole);
        podAdminGateway.addPodMember(podId, newMember);

        uint256 numPodMembers = factory.getNumMembers(podId);
        assertEq(numPodMembers, podConfig.members.length + 1);

        address[] memory podMembers = factory.getPodMembers(podId);
        assertEq(podMembers[0], newMember);
    }

    /// @notice Validate that the specific add member pod admin can remove members
    function testSpecificRemoveMemberRole() public {
        address userWithSpecificRole = address(0x11);

        // Create role in core
        bytes32 specificPodRemoveRole = keccak256(
            abi.encode(podId, "ORCA_POD", "POD_REMOVE_MEMBER_ROLE")
        );

        vm.startPrank(feiDAOTimelock);
        ICore(core).createRole(specificPodRemoveRole, TribeRoles.GOVERNOR);
        ICore(core).grantRole(specificPodRemoveRole, userWithSpecificRole);
        vm.stopPrank();

        vm.prank(userWithSpecificRole);
        podAdminGateway.removePodMember(podId, podConfig.members[0]);

        uint256 numPodMembers = factory.getNumMembers(podId);
        assertEq(numPodMembers, podConfig.members.length - 1);

        address[] memory podMembers = factory.getPodMembers(podId);
        assertEq(podMembers[0], podConfig.members[1]);
        assertEq(podMembers[1], podConfig.members[2]);
    }

    /// @notice Validate that the veto role functions
    function testVetoPermission() public {
        vm.prank(feiDAOTimelock);
        vm.expectRevert(
            bytes("TimelockController: operation cannot be cancelled")
        );
        podAdminGateway.veto(podId, bytes32("5"));
    }

    /// @notice Validate that the veto role functions
    function testVetoPermissionWithSpecificRole() public {
        address userWithSpecificRole = address(0x11);

        // Create role in core
        bytes32 specificPodRemoveRole = keccak256(
            abi.encode(podId, "ORCA_POD", "POD_VETO_ROLE")
        );

        vm.startPrank(feiDAOTimelock);
        ICore(core).createRole(specificPodRemoveRole, TribeRoles.GOVERNOR);
        ICore(core).grantRole(specificPodRemoveRole, userWithSpecificRole);
        vm.stopPrank();

        vm.prank(userWithSpecificRole);
        vm.expectRevert(
            bytes("TimelockController: operation cannot be cancelled")
        );
        podAdminGateway.veto(podId, bytes32("5"));
    }

    /// @notice Validate that the pod admin contract can be transferred to another admin
    function testTransferPodAdmin() public {
        address newAdmin = address(0x11);

        vm.prank(feiDAOTimelock);
        podAdminGateway.transferPodAdmin(podId, newAdmin);

        // Validate admin set on pod contract was updated everywhere as expected
        address orcaControllerReportedAdmin = IControllerV1(podController)
            .podAdmin(podId);
        assertEq(orcaControllerReportedAdmin, newAdmin);

        address podFactoryReportedAdmin = factory.getPodAdmin(podId);
        assertEq(podFactoryReportedAdmin, newAdmin);
    }
}
