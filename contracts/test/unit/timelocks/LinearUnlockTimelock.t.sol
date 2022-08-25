// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {Vm} from "../../utils/Vm.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../utils/Fixtures.sol";
import {MockERC20} from "../../../mock/MockERC20.sol";
import {Core} from "../../../core/Core.sol";
import {LinearUnlockTimelock} from "../../../timelocks/LinearUnlockTimelock.sol";

contract LinearUnlockTimelockTest is DSTest {
    Vm public constant vm = Vm(HEVM_ADDRESS);
    FeiTestAddresses public addresses = getAddresses();

    LinearUnlockTimelock timelock;
    MockERC20 token;

    address beneficiary = address(0x42);
    uint256 duration = 86400 * 30; // 30 days
    uint256 cliffDuration = 120; // 2 minutes
    address clawbackAdmin = address(0x1);
    uint256 startTime = 0;
    uint256 mintAmount = 10e18;

    function setUp() public {
        Core core = getCore();
        token = new MockERC20();

        timelock = new LinearUnlockTimelock(
            address(core),
            beneficiary,
            duration,
            address(token),
            cliffDuration,
            clawbackAdmin,
            startTime // startTime = 0, which will actually set start time to block.timestamp (1 for Foundry)
        );

        // Mint tokens to timelock
        token.mint(address(timelock), mintAmount);
    }

    /// @notice Validate initial timelock state
    function testInitialState() public {
        assertEq(timelock.beneficiary(), beneficiary);
        assertEq(timelock.duration(), duration);
        assertEq(address(timelock.lockedToken()), address(token));
        assertEq(timelock.cliffSeconds(), cliffDuration);
        assertEq(timelock.clawbackAdmin(), clawbackAdmin);
        assertEq(timelock.totalToken(), mintAmount);
    }

    /// @notice Validate failure in unlocking liquidity if not governor
    function testOnlyGovernorUnlockLiquidity() public {
        vm.prank(address(100));
        vm.expectRevert(bytes("CoreRef: Caller is not a governor"));
        timelock.unlockLiquidity();
    }

    /// @notice Validate can unlock liquidity
    function testUnlockLiquidity() public {
        vm.prank(addresses.governorAddress);
        timelock.unlockLiquidity();

        // Validate beneficiary received all the tokens
        assertEq(token.balanceOf(beneficiary), mintAmount);
        assertEq(token.balanceOf(address(timelock)), 0);
        assertEq(timelock.totalToken(), 0);
    }

    /// @notice Validate that can unlock at end of vesting
    function testUnlockEndOfVesting() public {
        // Fast forward past end of vesting
        vm.warp(duration + 1);

        vm.prank(addresses.governorAddress);
        timelock.unlockLiquidity();

        // Validate beneficiary received all the tokens
        assertEq(token.balanceOf(beneficiary), mintAmount);
        assertEq(token.balanceOf(address(timelock)), 0);
        assertEq(timelock.totalToken(), 0);
    }

    /// @notice Validate can unlock after a claim and that accounting is correct
    function testUnlockLiquidityAfterClaim() public {
        vm.warp(cliffDuration + 1); // pass the cliff

        vm.prank(beneficiary);
        timelock.releaseMax(beneficiary);

        uint256 beneficiaryBalance = token.balanceOf(beneficiary);
        assertGt(beneficiaryBalance, 0);
        assertEq(token.balanceOf(address(timelock)), mintAmount - beneficiaryBalance);

        vm.warp(100);
        vm.prank(addresses.governorAddress);
        timelock.unlockLiquidity();

        // Validate balances
        uint256 finalBeneficiaryBalance = token.balanceOf(beneficiary);
        assertGt(finalBeneficiaryBalance, 0);
        assertEq(finalBeneficiaryBalance, mintAmount);
        assertEq(token.balanceOf(address(timelock)), 0);
        assertEq(timelock.totalToken(), 0);
    }
}
