// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "./utils/DSTest.sol";
import {Vm} from "./utils/Vm.sol";
import {getCore, getAddresses, FeiTestAddresses} from "./utils/Fixtures.sol";
import {Core} from "../core/Core.sol";
import {RoleBastion} from "../pods/RoleBastion.sol";
import {TribeRoles} from "../core/TribeRoles.sol";
import "hardhat/console.sol";

contract RoleBastionTest is DSTest {
    Vm public constant vm = Vm(HEVM_ADDRESS);

    address tribalCouncil = address(0x1);
    address contractToGrant = address(0x2);

    FeiTestAddresses addresses;
    Core core;
    RoleBastion roleBastion;

    // Flow: Helper contract has GOVERNOR and ROLE_ADMIN ROLE
    // Helper contract creates a new role using the GOVERNOR role, and assigns role admin to ROLE_ADMIN
    // Helper contract given ROLE_ADMIN role

    function setUp() public {
        FeiTestAddresses memory addresses = getAddresses();
        core = getCore();
        roleBastion = new RoleBastion(address(core));

        // 1. Grant RoleAdministration GOVERNOR role
        vm.startPrank(addresses.governorAddress);
        core.grantRole(TribeRoles.GOVERNOR, address(roleBastion));
        vm.stopPrank();

        // 2. Grant a TribalCouncil and RoleBastion contract ROLE_ADMIN
        //     - needed to be able to create new roles
        vm.startPrank(addresses.governorAddress);
        core.createRole(TribeRoles.ROLE_ADMIN, TribeRoles.GOVERNOR);
        core.grantRole(TribeRoles.ROLE_ADMIN, tribalCouncil);
        core.grantRole(TribeRoles.ROLE_ADMIN, address(roleBastion));
        vm.stopPrank();
    }

    /// @notice Validate RoleAdmin contract has relevant permissions
    function testInitialState() public {
        assertTrue(core.isGovernor(address(roleBastion)));
        assertTrue(core.hasRole(TribeRoles.ROLE_ADMIN, tribalCouncil));
    }

    function testCreateRole() public {
        bytes32 roleToCreate = keccak256("TEST_ROLE");

        vm.prank(tribalCouncil);
        roleBastion.createRole(roleToCreate);
    }

    function testConvenienceGetter() public {
        bytes32 roleToCreate = keccak256("TEST_ROLE");

        vm.prank(tribalCouncil);
        roleBastion.createRole(roleToCreate);

        vm.prank(tribalCouncil);
        roleBastion.grantRole(roleToCreate, contractToGrant);
        assertTrue(core.hasRole(roleToCreate, contractToGrant));

        assertTrue(roleBastion.hasRole(roleToCreate, contractToGrant));
    }

    function testGrantRole() public {
        bytes32 roleToCreate = keccak256("TEST_ROLE");

        vm.prank(tribalCouncil);
        roleBastion.createRole(roleToCreate);

        vm.prank(tribalCouncil);
        roleBastion.grantRole(roleToCreate, contractToGrant);
        assertTrue(core.hasRole(roleToCreate, contractToGrant));
    }

    function testRevokeRole() public {
        bytes32 roleToCreate = keccak256("TEST_ROLE");

        vm.prank(tribalCouncil);
        roleBastion.createRole(roleToCreate);

        vm.prank(tribalCouncil);
        roleBastion.grantRole(roleToCreate, contractToGrant);
        assertTrue(core.hasRole(roleToCreate, contractToGrant));

        vm.prank(tribalCouncil);
        roleBastion.revokeRole(roleToCreate, contractToGrant);

        // Validate does not have role
    }
}
