// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {ControllerV1} from "@orcaprotocol/contracts/contracts/ControllerV1.sol";
import {MemberToken} from "@orcaprotocol/contracts/contracts/MemberToken.sol";
import {Vm} from "../../utils/Vm.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {PodFactory} from "../../../pods/PodFactory.sol";
import {PodAdminGateway} from "../../../pods/PodAdminGateway.sol";
import {IPodAdminGateway} from "../../../pods/interfaces/IPodAdminGateway.sol";
import {mintOrcaTokens, getPodParamsWithTimelock} from "../fixtures/Orca.sol";
import {IPodFactory} from "../../../pods/interfaces/IPodFactory.sol";
import {TribeRoles} from "../../../core/TribeRoles.sol";
import {ICore} from "../../../core/ICore.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";
import {Core} from "../../../core/Core.sol";

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
    address podController = MainnetAddresses.ORCA_POD_CONTROLLER_V1_2;
    address feiDAOTimelock = MainnetAddresses.FEI_DAO_TIMELOCK;

    function setUp() public {
        // 1. Deploy pod factory
        factory = new PodFactory(core, memberToken, podController, podExecutor);

        // 2. Deploy pod admin gateway, to expose pod admin functionality
        podAdminGateway = new PodAdminGateway(core, memberToken, address(factory));

        // Grant the factory the relevant roles to disable membership locks
        vm.startPrank(feiDAOTimelock);
        Core(core).createRole(TribeRoles.POD_ADMIN, TribeRoles.GOVERNOR);
        Core(core).grantRole(TribeRoles.POD_ADMIN, address(factory));
        vm.stopPrank();

        // 3. Make config for pod, mint Orca tokens to factory
        IPodFactory.PodConfig memory config = getPodParamsWithTimelock(address(podAdminGateway));
        podConfig = config;
        mintOrcaTokens(address(factory), 2, vm);

        // 4. Create pod
        vm.prank(feiDAOTimelock);
        (podId, timelock, safe) = factory.createOptimisticPod(podConfig);
    }

    /// @notice Validate that podAdminGateway contract pod admin, and initial state is valid
    function testInitialState() public {
        address podAdmin = factory.getPodAdmin(podId);
        assertEq(podAdmin, address(podAdminGateway));

        // Validate PodAdminGateway has CANCELLER role, this will allow it to veto
        TimelockController timelockContract = TimelockController(payable(timelock));
        assertTrue(timelockContract.hasRole(timelockContract.CANCELLER_ROLE(), address(podAdminGateway)));

        assertTrue(factory.getIsMembershipTransferLocked(podId));
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
        assertEq(numPodMembers, podConfig.members.length - membersToRemove.length);

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

    /// @notice Validate can lock membership transfers
    function testLockMembershipTransfer() public {
        vm.prank(feiDAOTimelock);
        podAdminGateway.lockMembershipTransfers(podId);

        bool memberTransfersLocked = factory.getIsMembershipTransferLocked(podId);
        assertTrue(memberTransfersLocked);
    }

    /// @notice Validate can unlock membership transfers
    function testUnLockMembershipTransfer() public {
        vm.prank(feiDAOTimelock);
        podAdminGateway.lockMembershipTransfers(podId);

        vm.prank(feiDAOTimelock);
        podAdminGateway.unlockMembershipTransfers(podId);

        bool memberTransfersLocked = factory.getIsMembershipTransferLocked(podId);
        assertFalse(memberTransfersLocked);
    }

    /// @notice Transfer pod admin to new admin
    function testTransferPodAdmin() public {
        address memberToRemove = podConfig.members[0];
        address newAdmin = address(0x22);

        vm.prank(feiDAOTimelock);
        podAdminGateway.transferAdmin(podId, newAdmin);

        address newAdminOnFactory = factory.getPodAdmin(podId);
        assertEq(newAdminOnFactory, newAdmin);

        address newAdminOnController = ControllerV1(podController).podAdmin(podId);
        assertEq(newAdminOnController, newAdmin);

        // Validate new pod admin can perform an admin function, such as removing a member
        vm.prank(newAdmin);
        MemberToken(memberToken).burn(memberToRemove, podId);

        uint256 numPodMembers = factory.getNumMembers(podId);
        assertEq(numPodMembers, podConfig.members.length - 1);

        address[] memory podMembers = factory.getPodMembers(podId);
        assertEq(podMembers[0], podConfig.members[1]);
        assertEq(podMembers[1], podConfig.members[2]);
    }

    /// @notice Validate that a non-PodAdmin fails to call a priviledged admin method
    function testNonAdminFailsToRemoveMember() public {
        vm.expectRevert(bytes("UNAUTHORIZED"));
        podAdminGateway.removePodMember(podId, podConfig.members[0]);
    }

    /// @notice Validate that specific pod admin role is computed is expected
    function testGetSpecificPodAdminRole() public {
        bytes32 specificAdminRole = keccak256(abi.encode(podId, "_ORCA_POD", "_ADMIN"));
        assertEq(specificAdminRole, podAdminGateway.getSpecificPodAdminRole(podId));
    }

    /// @notice Validate that specific pod guardian role is computed is expected
    function testGetSpecificPodGuardianRole() public {
        bytes32 specificGuardianRole = keccak256(abi.encode(podId, "_ORCA_POD", "_GUARDIAN"));
        assertEq(specificGuardianRole, podAdminGateway.getSpecificPodGuardianRole(podId));
    }

    /// @notice Validate that the specific pod admin can add a member to a pod
    function testSpecificPodAdminCanAdd() public {
        address userWithSpecificRole = address(0x11);

        // Create role in core
        bytes32 specificAdminRole = keccak256(abi.encode(podId, "_ORCA_POD", "_ADMIN"));

        vm.startPrank(feiDAOTimelock);
        ICore(core).createRole(specificAdminRole, TribeRoles.GOVERNOR);
        ICore(core).grantRole(specificAdminRole, userWithSpecificRole);
        vm.stopPrank();

        address newMember = address(0x12);
        vm.prank(userWithSpecificRole);
        podAdminGateway.addPodMember(podId, newMember);

        uint256 numPodMembers = factory.getNumMembers(podId);
        assertEq(numPodMembers, podConfig.members.length + 1);

        address[] memory podMembers = factory.getPodMembers(podId);
        assertEq(podMembers[0], newMember);
    }

    /// @notice Validate that the specific pod admin can remove members
    function testSpecificPodAdminCanRemove() public {
        address userWithSpecificRole = address(0x11);

        // Create role in core
        bytes32 specificPodAdmin = keccak256(abi.encode(podId, "_ORCA_POD", "_ADMIN"));

        vm.startPrank(feiDAOTimelock);
        ICore(core).createRole(specificPodAdmin, TribeRoles.GOVERNOR);
        ICore(core).grantRole(specificPodAdmin, userWithSpecificRole);
        vm.stopPrank();

        vm.prank(userWithSpecificRole);
        podAdminGateway.removePodMember(podId, podConfig.members[0]);

        uint256 numPodMembers = factory.getNumMembers(podId);
        assertEq(numPodMembers, podConfig.members.length - 1);

        address[] memory podMembers = factory.getPodMembers(podId);
        assertEq(podMembers[0], podConfig.members[1]);
        assertEq(podMembers[1], podConfig.members[2]);
    }

    /// @notice Validate that the specific pod guardian can remove members
    function testSpecificPodGuardianCanRemove() public {
        address userWithSpecificRole = address(0x11);

        // Create role in core
        bytes32 specificPodGuardian = keccak256(abi.encode(podId, "_ORCA_POD", "_GUARDIAN"));

        vm.startPrank(feiDAOTimelock);
        ICore(core).createRole(specificPodGuardian, TribeRoles.GOVERNOR);
        ICore(core).grantRole(specificPodGuardian, userWithSpecificRole);
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
        // Following revert indicates that the access control check has been passed
        vm.prank(feiDAOTimelock);
        vm.expectRevert(bytes("TimelockController: operation cannot be cancelled"));
        podAdminGateway.veto(podId, bytes32("5"));
    }

    /// @notice Validate that the specific pod amdin can veto
    function testSpecificPodAdminCanVeto() public {
        address userWithSpecificRole = address(0x11);

        // Create role in core
        bytes32 specificPodAdmin = keccak256(abi.encode(podId, "_ORCA_POD", "_ADMIN"));

        vm.startPrank(feiDAOTimelock);
        ICore(core).createRole(specificPodAdmin, TribeRoles.GOVERNOR);
        ICore(core).grantRole(specificPodAdmin, userWithSpecificRole);
        vm.stopPrank();

        vm.prank(userWithSpecificRole);
        vm.expectRevert(bytes("TimelockController: operation cannot be cancelled"));
        podAdminGateway.veto(podId, bytes32("5"));
    }
}
