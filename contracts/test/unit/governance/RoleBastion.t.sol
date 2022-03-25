// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../../utils/DSTest.sol";
import {Vm} from "../../utils/Vm.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../utils/Fixtures.sol";
import {Core} from "../../../core/Core.sol";
import {RoleBastionGranter} from "../../../pods/RoleBastionGranter.sol";
import {TribeRoles} from "../../../core/TribeRoles.sol";

contract RoleBastionGranterTest is DSTest {
    Vm public constant vm = Vm(HEVM_ADDRESS);

    address tribalCouncil = address(0x1);
    address contractToGrant = address(0x2);
    bytes32 dummyRole = keccak256("DUMMY_ROLE");

    FeiTestAddresses addresses;
    Core core;
    RoleBastionGranter roleGranter;

    function setUp() public {
        addresses = getAddresses();
        core = getCore();
        roleGranter = new RoleBastionGranter(address(core));

        // 1. Grant a TribalCouncil and RoleBastion contract ROLE_ADMIN
        //     - needed to be able to create new roles
        vm.startPrank(addresses.governorAddress);
        core.createRole(TribeRoles.ROLE_ADMIN, TribeRoles.GOVERNOR);
        core.grantRole(TribeRoles.ROLE_ADMIN, tribalCouncil);
        core.grantRole(TribeRoles.ROLE_ADMIN, address(roleGranter));

        // 2. Create dummyRole, which ROLE_ADMIN becomes admin of
        core.createRole(dummyRole, TribeRoles.ROLE_ADMIN);
        vm.stopPrank();

        // Grant RoleAdministration GOVERNOR role
        // vm.startPrank(addresses.governorAddress);
        // core.grantRole(TribeRoles.GOVERNOR, address(roleGranter));
        // vm.stopPrank();
    }

    /// @notice Validate RoleAdmin contract has relevant permissions
    function testInitialState() public {
        assertTrue(core.hasRole(TribeRoles.ROLE_ADMIN, tribalCouncil));

        bytes32[] memory allRoles = roleGranter.getAllRolesGranted();
        assertTrue(allRoles.length == 0);
    }

    function testGrantRole() public {
        vm.prank(tribalCouncil);
        roleGranter.grantRole(dummyRole, contractToGrant);

        assertTrue(core.hasRole(dummyRole, contractToGrant));
        assertTrue(roleGranter.hasRole(dummyRole, contractToGrant));

        bytes32[] memory allRoles = roleGranter.getAllRolesGranted();
        assertTrue(allRoles.length == 1);

        address[] memory addressesWithRole = roleGranter.getAddressesWithRole(
            dummyRole
        );
        assertEq(addressesWithRole.length, 1);
        assertEq(addressesWithRole[0], contractToGrant);
    }

    function testRevokeRole() public {
        vm.prank(tribalCouncil);
        roleGranter.grantRole(dummyRole, contractToGrant);

        vm.prank(tribalCouncil);
        roleGranter.revokeRole(dummyRole, contractToGrant);

        bytes32[] memory allRoles = roleGranter.getAllRolesGranted();
        assertTrue(allRoles.length == 0);

        assertFalse(roleGranter.hasRole(dummyRole, contractToGrant));
    }

    // function testCreateRole() public {
    //     bytes32 roleToCreate = keccak256("TEST_ROLE");

    //     vm.prank(tribalCouncil);
    //     roleGranter.createRole(roleToCreate);
    // }
}
