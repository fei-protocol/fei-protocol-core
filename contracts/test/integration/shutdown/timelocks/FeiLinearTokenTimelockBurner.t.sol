// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../../../utils/DSTest.sol";
import {Vm} from "../../../utils/Vm.sol";
import {MainnetAddresses} from "../../fixtures/MainnetAddresses.sol";
import {FeiLinearTokenTimelockBurner} from "../../../../shutdown/timelocks/FeiLinearTokenTimelockBurner.sol";
import {LinearTokenTimelock} from "../../../../timelocks/LinearTokenTimelock.sol";
import {Fei} from "../../../../fei/Fei.sol";

/// @notice Integration test for the Fei token timelock burner contract. Burns the Rari token timelock
contract FeiTimelockBurnerIntegrationTest is DSTest {
    FeiLinearTokenTimelockBurner rariFeiTimelockBurner;

    LinearTokenTimelock rariFeiTimelock = LinearTokenTimelock(payable(MainnetAddresses.RARI_FEI_TOKEN_TIMELOCK));
    Fei fei = Fei(MainnetAddresses.FEI);

    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        rariFeiTimelockBurner = new FeiLinearTokenTimelockBurner(MainnetAddresses.RARI_FEI_TOKEN_TIMELOCK);

        // Set pending admin of the Rari Fei Token timelock to be the rariFeiTimelockBurner
        address rariBeneficiary = rariFeiTimelock.beneficiary();
        vm.prank(rariBeneficiary);
        rariFeiTimelock.setPendingBeneficiary(address(rariFeiTimelockBurner));
    }

    function testInitialState() public {
        assertEq(address(rariFeiTimelockBurner.timelock()), MainnetAddresses.RARI_FEI_TOKEN_TIMELOCK);
    }

    /// @notice Validate that the beneficiary can be accepted for the timelock passed at construction
    function testAcceptBeneficiary() public {
        rariFeiTimelockBurner.acceptBeneficiary();
        assertEq(rariFeiTimelock.beneficiary(), address(rariFeiTimelockBurner));
    }

    /// @notice Validate releasing TRIBE funds from the parent timelock and sending to the Treasury
    function testBurnFeiHeld() public {
        // Accept beneficiary
        rariFeiTimelockBurner.acceptBeneficiary();

        uint256 initialFeiSupply = fei.totalSupply();

        // Burn Fei
        rariFeiTimelockBurner.burnFeiHeld();
        assertEq(fei.balanceOf(address(rariFeiTimelockBurner)), 0);

        uint256 finalFeiSupply = fei.totalSupply();
        assertGt(initialFeiSupply - finalFeiSupply, 0);
    }
}
