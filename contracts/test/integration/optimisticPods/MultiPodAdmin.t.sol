// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {Vm} from "../../utils/Vm.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {PodFactory} from "../../../pods/PodFactory.sol";
import {MultiPodAdmin} from "../../../pods/MultiPodAdmin.sol";
import {mintOrcaTokens, getPodParams} from "../fixtures/Orca.sol";
import {IPodFactory} from "../../../pods/IPodFactory.sol";

contract MultiPodAdminIntegrationTest is DSTest {
    Vm public constant vm = Vm(HEVM_ADDRESS);

    PodFactory factory;
    MultiPodAdmin multiPodAdmin;
    IPodFactory.PodConfig podConfig;
    uint256 podId;

    address private core = 0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9;
    address private podController = 0xD89AAd5348A34E440E72f5F596De4fA7e291A3e8;
    address private memberToken = 0x0762aA185b6ed2dCA77945Ebe92De705e0C37AE3;
    address private feiDAOTimelock = 0xd51dbA7a94e1adEa403553A8235C302cEbF41a3c;
    address private podExecutor = address(0x500);

    function setUp() public {
        // 1.0 Deploy pod factory
        factory = new PodFactory(core, podController, memberToken, podExecutor);

        // 2.0 Deploy multi-pod admin contract, to expose pod admin functionality
        multiPodAdmin = new MultiPodAdmin(core, memberToken);

        // 3.0 Make config for pod, mint Orca tokens to factory
        (IPodFactory.PodConfig memory config, uint256 minDelay) = getPodParams(
            address(multiPodAdmin)
        );
        podConfig = config;
        mintOrcaTokens(address(factory), 2, vm);

        // 4.0 Create pod
        vm.prank(feiDAOTimelock);
        (podId, ) = factory.createChildOptimisticPod(podConfig, minDelay);

        // 5.0 Record admin in MultiPodAdmin
        vm.prank(feiDAOTimelock);
        multiPodAdmin.addPodAdmin(podId, address(multiPodAdmin));
    }

    function testInitialState() public {
        address[] memory allPodAdmins = multiPodAdmin.getPodAdmins(podId);
        assertEq(allPodAdmins.length, 1);
        assertEq(allPodAdmins[0], address(multiPodAdmin));
        assertEq(factory.getPodAdmin(podId), address(multiPodAdmin));
    }

    /// @notice Validate that a podAdmin can be added for a particular pod
    function testAddPodAdmin() public {
        address extraAdmin = address(0x10);

        vm.prank(feiDAOTimelock);
        multiPodAdmin.addPodAdmin(podId, extraAdmin);

        address[] memory allPodAdmins = multiPodAdmin.getPodAdmins(podId);
        assertEq(allPodAdmins.length, 2);
        assertEq(allPodAdmins[0], address(multiPodAdmin));
        assertEq(allPodAdmins[1], extraAdmin);
    }

    /// @notice Validate that a podAdmin can be removed for a particular pod
    function testRemovePodAdmin() public {
        vm.prank(feiDAOTimelock);
        multiPodAdmin.removePodAdmin(podId, address(multiPodAdmin));

        address[] memory allPodAdmins = multiPodAdmin.getPodAdmins(podId);
        assertEq(allPodAdmins.length, 0);
    }

    /// @notice Validate that an added podAdmin has access to admin functionality for a pod
    function testPodAdminCanAddMembers() public {
        address extraAdmin = address(0x10);
        vm.prank(feiDAOTimelock);
        multiPodAdmin.addPodAdmin(podId, extraAdmin);

        // Add member to pod
        address newPodMember = address(0x11);
        vm.prank(extraAdmin);
        multiPodAdmin.addMemberToPod(podId, newPodMember);

        // Validate membership added
        uint256 numMembers = factory.getNumMembers(podId);
        uint256 initialNumMembers = podConfig.members.length;
        assertEq(numMembers, initialNumMembers + 1);

        address[] memory members = factory.getPodMembers(podId);
        assertEq(members[0], newPodMember);
    }

    function testPodAdminCanRemoveMembers() public {
        address extraAdmin = address(0x10);
        vm.prank(feiDAOTimelock);
        multiPodAdmin.addPodAdmin(podId, extraAdmin);

        // Remove member from pod
        address podMemberToRemove = factory.getPodMembers(podId)[0];
        vm.prank(extraAdmin);
        multiPodAdmin.removeMemberFromPod(podId, podMemberToRemove);

        // Validate membership added
        uint256 numMembers = factory.getNumMembers(podId);
        uint256 initialNumMembers = podConfig.members.length;
        assertEq(numMembers, initialNumMembers - 1);
    }

    /// @notice Validate that a non-PodAdmin fails to call a priviledged admin method
    function testNonExposedAdminFailsToRemove() public {
        vm.expectRevert(bytes("Caller not added as an admin"));
        multiPodAdmin.removeMemberFromPod(podId, address(0x1));
    }
}
