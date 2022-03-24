// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "./utils/DSTest.sol";
import {Vm} from "./utils/Vm.sol";
import {getCore, getAddresses, FeiTestAddresses} from "./utils/Fixtures.sol";
import {Core} from "../core/Core.sol";
import {RoleBastion} from "../pods/RoleBastion.sol";
import {TribeRoles} from "../core/TribeRoles.sol";

// import "hardhat/console.sol";

contract RoleBastionTest is DSTest {
    Vm public constant vm = Vm(HEVM_ADDRESS);

    address tribalCouncil = address(0x1);
    address contractToGrant = address(0x2);
    bytes32 dummyRole = keccak256("DUMMY_ROLE");

    FeiTestAddresses addresses;
    Core core;
    RoleBastion roleBastion;

    function setUp() public {
        addresses = getAddresses();
        core = getCore();
        roleBastion = new RoleBastion(address(core));

        // 1. Grant a TribalCouncil and RoleBastion contract ROLE_ADMIN
        //     - needed to be able to create new roles
        vm.startPrank(addresses.governorAddress);
        core.createRole(TribeRoles.ROLE_ADMIN, TribeRoles.GOVERNOR);
        core.grantRole(TribeRoles.ROLE_ADMIN, tribalCouncil);
        core.grantRole(TribeRoles.ROLE_ADMIN, address(roleBastion));

        // 2. Create dummyRole, which ROLE_ADMIN becomes admin of
        core.createRole(dummyRole, TribeRoles.ROLE_ADMIN);
        vm.stopPrank();

        // Grant RoleAdministration GOVERNOR role
        // vm.startPrank(addresses.governorAddress);
        // core.grantRole(TribeRoles.GOVERNOR, address(roleBastion));
        // vm.stopPrank();
    }

    /// @notice Validate RoleAdmin contract has relevant permissions
    function testInitialState() public {
        assertTrue(core.hasRole(TribeRoles.ROLE_ADMIN, tribalCouncil));

        bytes32[] memory allRoles = roleBastion.getAllRolesGranted();
        assertTrue(allRoles.length == 0);
    }

    function testGrantRole() public {
        vm.prank(tribalCouncil);
        roleBastion.grantRole(dummyRole, contractToGrant);

        assertTrue(core.hasRole(dummyRole, contractToGrant));
        assertTrue(roleBastion.hasRole(dummyRole, contractToGrant));

        bytes32[] memory allRoles = roleBastion.getAllRolesGranted();
        assertTrue(allRoles.length == 1);

        address[] memory addressesWithRole = roleBastion.getAddressesWithRole(
            dummyRole
        );
        assertEq(addressesWithRole.length, 1);
        assertEq(addressesWithRole[0], contractToGrant);
    }

    function testRevokeRole() public {
        vm.prank(tribalCouncil);
        roleBastion.grantRole(dummyRole, contractToGrant);

        vm.prank(tribalCouncil);
        roleBastion.revokeRole(dummyRole, contractToGrant);

        bytes32[] memory allRoles = roleBastion.getAllRolesGranted();
        assertTrue(allRoles.length == 0);

        assertFalse(roleBastion.hasRole(dummyRole, contractToGrant));
    }

    // function testCreateRole() public {
    //     bytes32 roleToCreate = keccak256("TEST_ROLE");

    //     vm.prank(tribalCouncil);
    //     roleBastion.createRole(roleToCreate);
    // }
}
