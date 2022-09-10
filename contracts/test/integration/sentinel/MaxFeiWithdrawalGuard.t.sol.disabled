// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../../utils/DSTest.sol";
import {StdLib} from "../../utils/StdLib.sol";
import {Vm} from "../../utils/Vm.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";
import {Fei} from "../../../fei/Fei.sol";

import "../../../sentinel/PCVSentinel.sol";
import "../../../sentinel/guards/MaxFeiWithdrawalGuard.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MaxFeiWithdrawalGuardIntegrationTest is DSTest, StdLib {
    PCVSentinel sentinel;
    MaxFeiWithdrawalGuard guard;

    IERC20 fei = IERC20(MainnetAddresses.FEI);

    Vm public constant vm = Vm(HEVM_ADDRESS);

    address public deposit1 = MainnetAddresses.AAVE_FEI_PCV_DEPOSIT;
    address public liquiditySource1 = MainnetAddresses.AFEI;

    address public deposit2 = MainnetAddresses.RARI_POOL_79_FEI_PCV_DEPOSIT;
    address public liquiditySource2 = MainnetAddresses.RARI_POOL_79_FEI;

    function setUp() public {
        sentinel = PCVSentinel(MainnetAddresses.PCV_SENTINEL);

        uint256 len = 2;
        address[] memory deposits = new address[](len);
        address[] memory destinations = new address[](len);
        address[] memory liquiditySources = new address[](len);

        deposits[0] = deposit1;
        deposits[1] = deposit2;

        liquiditySources[0] = liquiditySource1;
        liquiditySources[1] = liquiditySource2;

        destinations[0] = MainnetAddresses.DAI_PSM;
        destinations[1] = MainnetAddresses.DAI_PSM;

        guard = new MaxFeiWithdrawalGuard(MainnetAddresses.CORE, deposits, destinations, liquiditySources);

        vm.prank(MainnetAddresses.FEI_DAO_TIMELOCK);
        sentinel.knight(address(guard));

        // Test assumes withdraw amount greater than liquidity
        // Mint and remove liquidity to set that up
        vm.startPrank(MainnetAddresses.FEI_DAO_TIMELOCK);

        Fei(MainnetAddresses.FEI).mint(deposit1, 500_000e18);
        IPCVDeposit(deposit1).deposit();

        Fei(MainnetAddresses.FEI).mint(deposit2, 500_000e18);
        IPCVDeposit(deposit2).deposit();
        vm.stopPrank();

        uint256 source1Burn = fei.balanceOf(liquiditySource1) - 1000e18;
        vm.prank(liquiditySource1);
        Fei(MainnetAddresses.FEI).burn(source1Burn);

        uint256 source2Burn = fei.balanceOf(liquiditySource2) - 1000e18;
        vm.prank(liquiditySource2);
        Fei(MainnetAddresses.FEI).burn(source2Burn);
    }

    function testGuardCanProtec() public {
        // 1. Check preconditions of deposit 1 withdraw
        assertTrue(guard.check());
        uint256 deposit1BalanceBefore = fei.balanceOf(liquiditySource1);
        uint256 feiPSMBalanceBefore = fei.balanceOf(MainnetAddresses.DAI_PSM);
        assertEq(guard.getAmountToWithdraw(IPCVDeposit(deposit1)), deposit1BalanceBefore);

        // 2. Withdraw from pool 8 FEI.
        sentinel.protec(address(guard));
        assertEq(fei.balanceOf(liquiditySource1), 0);
        assertEq(fei.balanceOf(MainnetAddresses.DAI_PSM), feiPSMBalanceBefore + deposit1BalanceBefore);

        // 3. Check preconditions of deposit 2 withdraw
        assertTrue(guard.check());
        uint256 deposit2BalanceBefore = fei.balanceOf(liquiditySource2);
        feiPSMBalanceBefore = fei.balanceOf(MainnetAddresses.DAI_PSM);
        assertEq(guard.getAmountToWithdraw(IPCVDeposit(deposit2)), deposit2BalanceBefore);

        // 4. Withdraw from deposit 2.
        sentinel.protec(address(guard));
        assertEq(fei.balanceOf(liquiditySource2), 0);
        assertEq(fei.balanceOf(MainnetAddresses.DAI_PSM), feiPSMBalanceBefore + deposit2BalanceBefore);

        // 5. Check no more withdrawals
        assertFalse(guard.check());
    }
}
