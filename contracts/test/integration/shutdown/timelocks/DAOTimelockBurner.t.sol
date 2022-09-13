// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../../../utils/DSTest.sol";
import {DAOTimelockBurner} from "../../../../shutdown/timelocks/DAOTimelockBurner.sol";
import {Timelock} from "../../../../dao/timelock/Timelock.sol";
import {Vm} from "../../../utils/Vm.sol";
import {MainnetAddresses} from "../../fixtures/MainnetAddresses.sol";

/// @notice Integration tests for the Fei and Rari DAO timelock burner contract
contract DAOBurnerTimelockIntegrationTest is DSTest {
    DAOTimelockBurner daoBurnerTimelock;

    Timelock feiDAOTimelock = Timelock(payable(MainnetAddresses.FEI_DAO_TIMELOCK));
    Timelock rariDAOTimelock = Timelock(payable(MainnetAddresses.RARI_DAO_TIMELOCK));

    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        daoBurnerTimelock = new DAOTimelockBurner();

        // Set pending admin of the Fei DAO timelock to be the daoTimelockBurner
        vm.prank(MainnetAddresses.FEI_DAO_TIMELOCK);
        feiDAOTimelock.setPendingAdmin(address(daoBurnerTimelock));

        // Set pending admin of the Rari DAO timelock to be the daoTimelockBurner
        vm.prank(MainnetAddresses.RARI_DAO_TIMELOCK);
        rariDAOTimelock.setPendingAdmin(address(daoBurnerTimelock));
    }

    /// @notice Validate that admin of the Fei DAO timelock can be accepted
    function testAcceptFeiDAOAdmin() public {
        daoBurnerTimelock.acceptFeiDAOTimelockAdmin();
        assertEq(feiDAOTimelock.admin(), address(daoBurnerTimelock));
    }

    /// @notice Validate that admin of the Rari DAO timelock can be accepted
    function testAcceptRariDAOAdmin() public {
        daoBurnerTimelock.acceptRariDAOTimelockAdmin();
        assertEq(rariDAOTimelock.admin(), address(daoBurnerTimelock));
    }
}
