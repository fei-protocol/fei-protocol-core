// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../../utils/DSTest.sol";
import {StdLib} from "../../utils/StdLib.sol";
import {Vm} from "../../utils/Vm.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";

import "../../../sentinel/PCVSentinel.sol";
import "../../../sentinel/guards/FuseWithdrawalGuard.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FuseWithdrawalGuardIntegrationTest is DSTest, StdLib {
    PCVSentinel sentinel;
    FuseWithdrawalGuard guard;

    IERC20 fei = IERC20(MainnetAddresses.FEI);
    IERC20 lusd = IERC20(MainnetAddresses.LUSD);

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
        destinations[1] = MainnetAddresses.LUSD_HOLDING_PCV_DEPOSIT;

        liquidityToLeaveList[0] = 100_000e18;
        // make liquidity to leave higher than liquidity in contract
        liquidityToLeaveList[1] = 10_000_000e18;

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

    function testGuardCanProtec() public {
        // 1. Check preconditions of FEI pool 8 withdraw
        assertTrue(guard.check());
        uint256 feiCTokenBalanceBefore = fei.balanceOf(MainnetAddresses.RARI_POOL_8_FEI);
        uint256 feiPSMBalanceBefore = fei.balanceOf(MainnetAddresses.DAI_PSM);
        assertEq(
            guard.getAmountToWithdraw(ERC20CompoundPCVDeposit(MainnetAddresses.RARI_POOL_8_FEI_PCV_DEPOSIT)),
            feiCTokenBalanceBefore - 100_000e18
        );

        // 2. Withdraw from pool 8 FEI.
        sentinel.protec(address(guard));
        assertEq(fei.balanceOf(MainnetAddresses.RARI_POOL_8_FEI), 100_000e18);
        assertEq(fei.balanceOf(MainnetAddresses.DAI_PSM), feiPSMBalanceBefore + feiCTokenBalanceBefore - 100_000e18);

        // 3. Check pool 8 LUSD is below liquidity minimum and adjust to 0.
        assertFalse(guard.check());

        vm.prank(MainnetAddresses.FEI_DAO_TIMELOCK);
        guard.setWithdrawInfo(
            MainnetAddresses.RARI_POOL_8_LUSD_PCV_DEPOSIT,
            FuseWithdrawalGuard.WithdrawInfo({
                destination: MainnetAddresses.LUSD_HOLDING_PCV_DEPOSIT,
                underlying: MainnetAddresses.LUSD,
                liquidityToLeave: 0
            })
        );
        // 4. Check preconditions of LUSD pool 8 withdraw
        assertTrue(guard.check());
        uint256 lusdCTokenBalanceBefore = lusd.balanceOf(MainnetAddresses.RARI_POOL_8_LUSD);
        uint256 lusdPSMBalanceBefore = lusd.balanceOf(MainnetAddresses.LUSD_HOLDING_PCV_DEPOSIT);
        assertEq(
            guard.getAmountToWithdraw(ERC20CompoundPCVDeposit(MainnetAddresses.RARI_POOL_8_LUSD_PCV_DEPOSIT)),
            lusdCTokenBalanceBefore
        );

        // 5. Withdraw from pool 8 LUSD.
        sentinel.protec(address(guard));
        assertEq(lusd.balanceOf(MainnetAddresses.RARI_POOL_8_LUSD), 0);
        assertEq(
            lusd.balanceOf(MainnetAddresses.LUSD_HOLDING_PCV_DEPOSIT),
            lusdPSMBalanceBefore + lusdCTokenBalanceBefore
        );

        // 6. Check no more withdrawals
        assertFalse(guard.check());
    }
}
