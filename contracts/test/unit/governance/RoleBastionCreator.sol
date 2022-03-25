// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../../utils/DSTest.sol";
import {Vm} from "../../utils/Vm.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../utils/Fixtures.sol";
import {RoleBastionCreator} from "../../../pods/RoleBastionCreator.sol";
import {TribeRoles} from "../../../core/TribeRoles.sol";
import {Core} from "../../../core/Core.sol";

contract RoleBastionCreatorTest is DSTest {
    address tribalCouncil = address(0x1);

    FeiTestAddresses addresses;
    Core core;
    RoleBastionCreator roleCreator;

    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        addresses = getAddresses();
        core = getCore();
        roleCreator = new RoleBastionCreator(address(core));

        // 1. Grant tribalCouncil ROLE_ADMIN role
        vm.startPrank(addresses.governorAddress);
        core.createRole(TribeRoles.ROLE_ADMIN, TribeRoles.GOVERNOR);
        core.grantRole(TribeRoles.ROLE_ADMIN, address(tribalCouncil));
        vm.stopPrank();

        // 2. Grant roleBastionCreator GOVERNOR
        vm.startPrank(addresses.governorAddress);
        core.grantRole(TribeRoles.GOVERNOR, address(roleCreator));
        vm.stopPrank();
    }

    /// @notice Validate initial state of roleCreator
    function testInitialState() public {
        assertTrue(core.hasRole(TribeRoles.GOVERNOR, address(roleCreator)));
        assertTrue(core.hasRole(TribeRoles.ROLE_ADMIN, address(tribalCouncil)));
    }

    /// @notice Validate that roleCreator can create a non-major role
    function testCreateNonMajorRole() public {
        bytes32 nonMajorRole = keccak256("DUMMY_ROLE");

        vm.prank(tribalCouncil);
        roleCreator.createRole(nonMajorRole);

        // Validate created role exists and has the appropriate admin
        bytes32[] memory createdRoles = roleCreator.getCreatedNonMajorRoles();
        assertEq(createdRoles.length, 1);
        assertEq(createdRoles[0], nonMajorRole);

        bool isRole = roleCreator.isRole(nonMajorRole);
        assertTrue(isRole);
    }

    /// @notice Validate that roleCreator can not create a major role
    function testCanNotCreateMajorRole() public {
        bytes32 majorRole = TribeRoles.MINTER;

        vm.startPrank(tribalCouncil);
        vm.expectRevert(bytes("Only non-major roles can be created"));
        roleCreator.createRole(majorRole);
        vm.stopPrank();
    }
}
