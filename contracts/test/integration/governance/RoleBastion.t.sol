// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../../utils/DSTest.sol";
import {Vm} from "../../utils/Vm.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../utils/Fixtures.sol";
import {RoleBastion} from "../../../pods/RoleBastion.sol";
import {TribeRoles} from "../../../core/TribeRoles.sol";
import {Core} from "../../../core/Core.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";

contract RoleBastionTest is DSTest {
    address tribalCouncil = address(0x1);
    RoleBastion roleBastion;

    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        roleBastion = new RoleBastion(MainnetAddresses.CORE);

        // Grant a test address ROLE_ADMIN
        vm.startPrank(MainnetAddresses.FEI_DAO_TIMELOCK);
        Core(MainnetAddresses.CORE).createRole(
            TribeRoles.ROLE_ADMIN,
            TribeRoles.GOVERNOR
        );
        Core(MainnetAddresses.CORE).grantRole(
            TribeRoles.ROLE_ADMIN,
            tribalCouncil
        );
        vm.stopPrank();
    }

    /// @notice Validate can not create a GOVERNOR role
    function testCanNotCreateGovernorRole() public {
        vm.prank(tribalCouncil);
        vm.expectRevert(bytes("Role already exists"));
        roleBastion.createRole(TribeRoles.GOVERNOR);
    }
}
