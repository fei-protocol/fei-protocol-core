// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../utils/DSTest.sol";
import {StdLib} from "../utils/StdLib.sol";
import {Vm} from "../utils/Vm.sol";
import {BalancerLBPSwapper} from "../../pcv/balancer/BalancerLBPSwapper.sol";
import {PCVGuardian} from "../../pcv/PCVGuardian.sol";

contract LBPSwapperIntegrationTest is DSTest, StdLib {
    BalancerLBPSwapper swapper;

    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        // Get LBP swapper instance
        // Transfer funds to it
        address swapperAddress = 0xF7991f4698ffb6716982aec7F78964Dd731C4A54;
        swapper = BalancerLBPSwapper(swapperAddress);
        PCVGuardian guardian = PCVGuardian(0x02435948F84d7465FB71dE45ABa6098Fc6eC2993);

        // Send 10k ETH to it
        address guardianMultisig = 0xB8f482539F2d3Ae2C9ea6076894df36D1f632775;

        vm.prank(guardianMultisig);
        guardian.withdrawERC20ToSafeAddress(
            0x98E5F5706897074a4664DD3a32eB80242d6E694B,
            swapperAddress,
            0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2,
            10000000000000000000000,
            true,
            false
        );
    }

    function testSwap() public {
        address tcSafe = 0x2EC598d8e3DF35E5D6F13AE2f05a7bB2704e92Ea;

        vm.warp(block.timestamp + 100000);
        vm.prank(tcSafe);
        swapper.swap();
    }
}
