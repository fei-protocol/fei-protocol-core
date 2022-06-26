// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../../utils/DSTest.sol";
import {StdLib} from "../../utils/StdLib.sol";
import {Vm} from "../../utils/Vm.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";

import "../../../sentinel/PCVSentinel.sol";
import "../../../sentinel/guards/FuseWithdrawalGuard.sol";

contract FuseWithdrawalGuardIntegrationTest is DSTest, StdLib {
    PCVSentinel sentinel;
    FuseWithdrawalGuard guard;

    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        sentinel = PCVSentinel(MainnetAddresses.PCV_SENTINEL);

        uint256 len = 2;
        address[] memory deposits = new address[](len);
        address[] memory destinations = new address[](len);
        address[] memory underlyings = new address[](len);
        uint96[] memory liquidityToLeaveList = new uint96[](len);

        deposits[0] = MainnetAddresses.RARI_POOL_8_FEI_PCV_DEPOSIT;
        deposits[1] = MainnetAddresses.RARI_POOL_8_LUSD_PCV_DEPOSIT;

        underlyings[0] = MainnetAddresses.FEI;
        underlyings[1] = MainnetAddresses.LUSD;

        destinations[0] = MainnetAddresses.DAI_PSM;
        destinations[1] = MainnetAddresses.LUSD_PSM;

        guard = new FuseWithdrawalGuard(
            MainnetAddresses.CORE,
            deposits,
            destinations,
            underlyings,
            liquidityToLeaveList
        );

        vm.prank(MainnetAddresses.FEI_DAO_TIMELOCK);
        sentinel.knight(address(guard));
    }

    // TODO beef up test
    function testGuardCanProtec() public {
        assertTrue(guard.check());
        sentinel.protec(address(guard));
        assertTrue(guard.check());
        sentinel.protec(address(guard));
        assertFalse(guard.check());
    }
}
