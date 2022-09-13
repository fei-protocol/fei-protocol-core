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

    address public deposit = MainnetAddresses.RARI_POOL_79_FEI_PCV_DEPOSIT;
    address public liquiditySource = MainnetAddresses.RARI_POOL_79_FEI;

    function setUp() public {
        sentinel = PCVSentinel(MainnetAddresses.PCV_SENTINEL);

        uint256 len = 1;
        address[] memory deposits = new address[](len);
        address[] memory destinations = new address[](len);
        address[] memory liquiditySources = new address[](len);

        deposits[0] = deposit;

        liquiditySources[0] = liquiditySource;

        destinations[0] = MainnetAddresses.DAI_PSM;

        guard = new MaxFeiWithdrawalGuard(MainnetAddresses.CORE, deposits, destinations, liquiditySources);

        vm.prank(MainnetAddresses.FEI_DAO_TIMELOCK);
        sentinel.knight(address(guard));

        // Test assumes withdraw amount greater than liquidity
        // Mint and remove liquidity to set that up`
        vm.startPrank(MainnetAddresses.FEI_DAO_TIMELOCK);
        Fei(MainnetAddresses.FEI).mint(deposit, 500_000e18);
        IPCVDeposit(deposit).deposit();
        vm.stopPrank();

        uint256 sourceBurn = fei.balanceOf(liquiditySource) - 1000e18;
        vm.prank(liquiditySource);
        Fei(MainnetAddresses.FEI).burn(sourceBurn);
    }

    function testGuardCanProtec() public {
        // 1. Check preconditions of deposit 1 withdraw
        assertTrue(guard.check());
        uint256 depositBalanceBefore = fei.balanceOf(liquiditySource);
        uint256 feiPSMBalanceBefore = fei.balanceOf(MainnetAddresses.DAI_PSM);
        assertEq(guard.getAmountToWithdraw(IPCVDeposit(deposit)), depositBalanceBefore);

        // 2. Withdraw from pool 8 FEI.
        sentinel.protec(address(guard));
        assertEq(fei.balanceOf(liquiditySource), 0);
        assertEq(fei.balanceOf(MainnetAddresses.DAI_PSM), feiPSMBalanceBefore + depositBalanceBefore);

        // 5. Check no more withdrawals
        assertFalse(guard.check());
    }
}
