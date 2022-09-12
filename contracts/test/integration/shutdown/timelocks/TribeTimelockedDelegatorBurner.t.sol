// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../../../utils/DSTest.sol";
import {Vm} from "../../../utils/Vm.sol";
import {MainnetAddresses} from "../../fixtures/MainnetAddresses.sol";
import {TribeTimelockedDelegatorBurner} from "../../../../shutdown/timelocks/TribeTimelockedDelegatorBurner.sol";
import {TimelockedDelegator} from "../../../../timelocks/TimelockedDelegator.sol";
import {Tribe} from "../../../../tribe/Tribe.sol";

/// @notice Integration test for the Tribe token timelocked delegator burner contract
/// @dev This version of the timelock has an undelegate() method in addition to the methods
///      on the LinearTokenTimelock
contract TribeTimelockedDelegatorBurnerIntegrationTest is DSTest {
    TribeTimelockedDelegatorBurner tribeTimelockBurner;

    TimelockedDelegator tribeTimelock = TimelockedDelegator(payable(MainnetAddresses.FEI_LABS_CONTRACT));
    Tribe tribe = Tribe(MainnetAddresses.TRIBE);

    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        tribeTimelockBurner = new TribeTimelockedDelegatorBurner(tribeTimelock);

        // Set pending admin of the Tribe Token timelock to be the burner
        vm.prank(tribeTimelock.beneficiary());
        tribeTimelock.setPendingBeneficiary(address(tribeTimelockBurner));

        // Undelegate some TRIBE to make enough available for withdrawals
        vm.prank(tribeTimelock.beneficiary());
        tribeTimelock.undelegate(MainnetAddresses.TRIBE_FEI_LABS_DEL);
    }

    /// @notice Validate that timelock to burn is setup
    function testInitialState() public {
        assertEq(address(tribeTimelockBurner.timelock()), MainnetAddresses.FEI_LABS_CONTRACT);
    }

    /// @notice Validate can undelegate from a delegate
    function testUndelegate() public {
        address newDelegate = address(0x2);

        // Mock making a delegation
        vm.prank(tribeTimelock.beneficiary());
        tribeTimelock.delegate(newDelegate, 100);

        uint256 initialTotalDelegated = tribeTimelock.totalDelegated();
        uint256 newDelegateAmount = tribeTimelock.delegateAmount(newDelegate);
        assertEq(newDelegateAmount, 100);

        // Have the burner accept the beneficiary
        tribeTimelockBurner.acceptBeneficiary();

        // Permissionlessly undelegate
        tribeTimelockBurner.undelegate(newDelegate);

        // Validate undelegation worked
        uint256 finalTotalDelegated = tribeTimelock.totalDelegated();
        assertEq(initialTotalDelegated - finalTotalDelegated, 100);

        uint256 finalDelegateAmount = tribeTimelock.delegateAmount(newDelegate);
        assertEq(finalDelegateAmount, 0);
    }

    /// @notice Validate that the beneficiary can be accepted for the timelock passed at construction
    function testAcceptBeneficiary() public {
        tribeTimelockBurner.acceptBeneficiary();
        assertEq(tribeTimelock.beneficiary(), address(tribeTimelockBurner));
    }

    /// @notice Validate releasing TRIBE funds from the parent timelock and sending to the Treasury
    function testSendTribeToTreasury() public {
        tribeTimelockBurner.acceptBeneficiary();
        uint256 initialTreasuryBalance = tribe.balanceOf(address(MainnetAddresses.CORE));

        // Send Tribe to Core treasury
        tribeTimelockBurner.sendTribeToTreaury();
        assertEq(tribe.balanceOf(address(tribeTimelockBurner)), 0);

        uint256 finalTreasuryBalance = tribe.balanceOf(address(MainnetAddresses.CORE));
        assertGt(finalTreasuryBalance - initialTreasuryBalance, 0);
    }
}
