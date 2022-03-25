// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../../utils/DSTest.sol";
import {Vm} from "../../utils/Vm.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../utils/Fixtures.sol";
import {RoleBastion} from "../../../pods/RoleBastion.sol";
import {TribeRoles} from "../../../core/TribeRoles.sol";
import {Core} from "../../../core/Core.sol";

contract RoleBastionTest is DSTest {
    address tribalCouncil = address(0x1);

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
        core.grantRole(TribeRoles.ROLE_ADMIN, address(tribalCouncil));
        vm.stopPrank();

        // 2. Grant roleBastionCreator GOVERNOR
        vm.startPrank(addresses.governorAddress);
        core.grantRole(TribeRoles.GOVERNOR, address(roleBastion));
        vm.stopPrank();
    }

    /// @notice Validate initial state of roleCreator
    function testInitialState() public {
        assertTrue(core.hasRole(TribeRoles.GOVERNOR, address(roleBastion)));
        assertTrue(core.hasRole(TribeRoles.ROLE_ADMIN, address(tribalCouncil)));
    }

    /// @notice Validate that roleCreator can create a non-major role
    function testCreateNewRole() public {
        bytes32 newRole = keccak256("DUMMY_ROLE");

        vm.prank(tribalCouncil);
        roleBastion.createRole(newRole);

        // Validate created role exists and has the appropriate admin
        bytes32 createdRoleAdmin = core.getRoleAdmin(newRole);
        assertEq(createdRoleAdmin, TribeRoles.ROLE_ADMIN);
    }

    /// @notice Validate that roleCreator can not create a major role
    function testCanNotCreateExistingRole() public {
        bytes32 existingRole = TribeRoles.MINTER;

        vm.startPrank(tribalCouncil);
        vm.expectRevert(bytes("Role already exists"));
        roleBastion.createRole(existingRole);
        vm.stopPrank();
    }
}
