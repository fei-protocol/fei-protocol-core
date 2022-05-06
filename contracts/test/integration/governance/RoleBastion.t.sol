// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../../utils/DSTest.sol";
import {Vm} from "../../utils/Vm.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../utils/Fixtures.sol";
import {RoleBastion} from "../../../pods/RoleBastion.sol";
import {TribeRoles} from "../../../core/TribeRoles.sol";
import {Core} from "../../../core/Core.sol";

contract RoleBastionIntegrationTest is DSTest {
    address tribalCouncil = address(0x1);
    address guardian = address(0x2);

    FeiTestAddresses addresses;
    Core core;
    RoleBastion roleBastion;

    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        addresses = getAddresses();
        core = getCore();
        roleBastion = new RoleBastion(address(core));

        // 1. Grant tribalCouncil ROLE_ADMIN role
        vm.startPrank(addresses.governorAddress);
        core.createRole(TribeRoles.ROLE_ADMIN, TribeRoles.GOVERNOR);
        core.grantRole(TribeRoles.ROLE_ADMIN, tribalCouncil);
        vm.stopPrank();

        // 2. Grant roleBastion GOVERNOR
        vm.startPrank(addresses.governorAddress);
        core.grantRole(TribeRoles.GOVERNOR, address(roleBastion));
        vm.stopPrank();

        // 3. Create a mock Guardian to pause the contract
        vm.startPrank(addresses.governorAddress);
        core.createRole(TribeRoles.GUARDIAN, TribeRoles.GOVERNOR);
        core.grantRole(TribeRoles.GUARDIAN, guardian);
        vm.stopPrank();
    }

    /// @notice Validate initial state of roleCreator
    function testInitialState() public {
        assertTrue(core.hasRole(TribeRoles.GOVERNOR, address(roleBastion)));
        assertTrue(core.hasRole(TribeRoles.ROLE_ADMIN, tribalCouncil));
    }

    /// @notice Validate that roleCreator can create a role
    function testCreateNewRole() public {
        bytes32 newRole = keccak256("DUMMY_ROLE");

        vm.prank(tribalCouncil);
        roleBastion.createRole(newRole);

        // Validate created role exists and has the appropriate admin
        bytes32 createdRoleAdmin = core.getRoleAdmin(newRole);
        assertEq(createdRoleAdmin, TribeRoles.ROLE_ADMIN);
    }

    /// @notice Validate that created role can be granted by core
    function testCreatedRoleCanBeGranted() public {
        bytes32 newRole = keccak256("DUMMY_ROLE");

        vm.prank(tribalCouncil);
        roleBastion.createRole(newRole);

        address roleReceiver = address(0x3);
        vm.prank(tribalCouncil); // ROLE_ADMIN is transferring the role
        core.grantRole(newRole, roleReceiver);

        // Validate address received role
        assertTrue(core.hasRole(newRole, roleReceiver));
    }

    /// @notice Validate that roleCreator can not create an already existing role
    function testCanNotCreateExistingRole() public {
        bytes32 existingRole = TribeRoles.MINTER;

        vm.startPrank(tribalCouncil);
        vm.expectRevert(bytes("Role already exists"));
        roleBastion.createRole(existingRole);
        vm.stopPrank();
    }

    /// @notice Validate that can not create a role of bytes32(0), which is the
    ///         CONTRACT_ADMIN_ROLE in core
    function testCanNotCreateZeroRole() public {
        bytes32 zeroRole = bytes32(0);
        vm.startPrank(tribalCouncil);
        vm.expectRevert(bytes("Can not create zero role"));
        roleBastion.createRole(zeroRole);
        vm.stopPrank();
    }

    /// @notice Validate can not create a role when paused
    function testCanPause() public {
        vm.prank(guardian);
        roleBastion.pause();

        bool isPaused = roleBastion.paused();
        assertTrue(isPaused);

        vm.startPrank(tribalCouncil);
        vm.expectRevert(bytes("Pausable: paused"));
        roleBastion.createRole(keccak256("DUMMY_ROLE"));
    }
}
