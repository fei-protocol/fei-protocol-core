pragma solidity ^0.8.4;

import {Vm} from "../utils/Vm.sol";
import {DSTest} from "../utils/DSTest.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../utils/Fixtures.sol";

import {ICore} from "../../core/ICore.sol";
import {MockERC20} from "../../mock/MockERC20.sol";
import {MockPCVDepositV2} from "../../mock/MockPCVDepositV2.sol";
import {PCVGuardian} from "../../pcv/PCVGuardian.sol";

contract PCVGuardianTest is DSTest {
    ICore private core;
    PCVGuardian private pcvGuardian;
    MockERC20 private token;
    MockPCVDepositV2 private pcvDeposit1;
    MockPCVDepositV2 private pcvDeposit2;
    MockPCVDepositV2 private pcvDeposit3;

    Vm public constant vm = Vm(HEVM_ADDRESS);
    FeiTestAddresses public addresses = getAddresses();

    function setUp() public {
        // get core
        core = getCore();

        // initialize mock tokens & deposits
        token = new MockERC20();
        pcvDeposit1 = new MockPCVDepositV2(address(core), address(token), 0, 0);
        pcvDeposit2 = new MockPCVDepositV2(address(core), address(token), 0, 0);
        pcvDeposit3 = new MockPCVDepositV2(address(core), address(token), 0, 0);
        token.mint(address(pcvDeposit1), 100e18);
        pcvDeposit1.deposit();
        payable(address(pcvDeposit1)).transfer(1 ether);

        // initialize pcv guardian
        address[] memory safeAddresses = new address[](2);
        safeAddresses[0] = address(pcvDeposit1);
        safeAddresses[1] = address(pcvDeposit2);
        pcvGuardian = new PCVGuardian(address(core), safeAddresses);
        // give roles to pcv guardian
        vm.startPrank(addresses.governorAddress);
        core.grantPCVController(address(pcvGuardian));
        core.grantGuardian(address(pcvGuardian));
        vm.stopPrank();

        // labels
        vm.label(address(core), "core");
        vm.label(address(token), "token");
        vm.label(address(pcvDeposit1), "pcvDeposit1");
        vm.label(address(pcvDeposit2), "pcvDeposit2");
        vm.label(address(pcvDeposit3), "pcvDeposit3");
        vm.label(address(pcvGuardian), "pcvGuardian");
    }

    // should have no safe addresses upon deployment when deployed with no safe addresses
    function testDeploy1() public {
        address[] memory safeAddresses = new address[](0);
        PCVGuardian pcvGuardianWithoutAddresses = new PCVGuardian(address(core), safeAddresses);
        address[] memory getSafeAddresses = pcvGuardianWithoutAddresses.getSafeAddresses();
        assertEq(getSafeAddresses.length, 0);
    }

    // should have safe addresses upon deployment when deployed with safe addresses
    function testDeploy2() public {
        address[] memory safeAddresses = new address[](1);
        safeAddresses[0] = address(0x42);
        PCVGuardian pcvGuardianWithoutAddresses = new PCVGuardian(address(core), safeAddresses);
        address[] memory getSafeAddresses = pcvGuardianWithoutAddresses.getSafeAddresses();
        assertEq(getSafeAddresses.length, 1);
        assertEq(getSafeAddresses[0], address(0x42));
    }

    // access control and state changes

    // should revert when calling setSafeAddress & setSafeAddresses from a non-privileged address
    // should revert when calling unsetSafeAddress & unsetSafeAddresses from a non-privileged address
    function testAccessControl1() public {
        address safeAddress = address(0x42);
        address[] memory safeAddresses = new address[](1);
        safeAddresses[0] = safeAddress;

        vm.expectRevert("UNAUTHORIZED");
        pcvGuardian.setSafeAddress(safeAddress);
        vm.expectRevert("UNAUTHORIZED");
        pcvGuardian.setSafeAddresses(safeAddresses);
        vm.expectRevert("UNAUTHORIZED");
        pcvGuardian.unsetSafeAddress(safeAddress);
        vm.expectRevert("UNAUTHORIZED");
        pcvGuardian.unsetSafeAddresses(safeAddresses);
    }

    // ADD safe address(es) :
    //   should allow PCV_GUARDIAN_ADMIN
    //   should allow GOVERNOR
    // REMOVE safe adress(es) :
    //   should allow GUARDIAN
    //   should allow PCV_GUARDIAN_ADMIN
    //   should allow GOVERNOR
    function testAccessControl2() public {
        address safeAddress = address(0x42);
        address[] memory safeAddresses = new address[](1);
        safeAddresses[0] = safeAddress;

        // none of the following calls shall revert if access
        // control is properly checked for the various callers
        vm.startPrank(addresses.pcvGuardianAdminAddress);
        pcvGuardian.setSafeAddress(safeAddress);
        pcvGuardian.unsetSafeAddress(safeAddress);
        pcvGuardian.setSafeAddresses(safeAddresses);
        pcvGuardian.unsetSafeAddresses(safeAddresses);
        vm.stopPrank();

        vm.startPrank(addresses.governorAddress);
        pcvGuardian.setSafeAddress(safeAddress);
        pcvGuardian.unsetSafeAddress(safeAddress);
        pcvGuardian.setSafeAddresses(safeAddresses);
        pcvGuardian.unsetSafeAddresses(safeAddresses);
        vm.stopPrank();

        vm.prank(addresses.pcvGuardianAdminAddress);
        pcvGuardian.setSafeAddress(safeAddress);
        vm.prank(addresses.guardianAddress);
        pcvGuardian.unsetSafeAddress(safeAddress);
        vm.prank(addresses.pcvGuardianAdminAddress);
        pcvGuardian.setSafeAddresses(safeAddresses);
        vm.prank(addresses.guardianAddress);
        pcvGuardian.unsetSafeAddresses(safeAddresses);
    }

    // should revert when calling withdrawToSafeAddress from a non-privileged address
    // should revert when calling withdrawETHToSafeAddress from a non-privileged address
    // should revert when calling withdrawERC20ToSafeAddress from a non-privileged address
    // should revert when calling withdrawRatioToSafeAddress from a non-privileged address
    // should revert when calling withdrawETHRatioToSafeAddress from a non-privileged address
    // should revert when calling withdrawERC20RatioToSafeAddress from a non-privileged address
    function testAccessControl3() public {
        vm.expectRevert("UNAUTHORIZED");
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1e18, false, false);
        vm.expectRevert("UNAUTHORIZED");
        pcvGuardian.withdrawETHToSafeAddress(address(pcvDeposit1), payable(address(pcvDeposit2)), 1e18, false, false);
        vm.expectRevert("UNAUTHORIZED");
        pcvGuardian.withdrawERC20ToSafeAddress(
            address(pcvDeposit1),
            address(pcvDeposit2),
            address(token),
            1e18,
            false,
            false
        );
        vm.expectRevert("UNAUTHORIZED");
        pcvGuardian.withdrawRatioToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1, false, false);
        vm.expectRevert("UNAUTHORIZED");
        pcvGuardian.withdrawETHRatioToSafeAddress(address(pcvDeposit1), payable(address(pcvDeposit2)), 1, false, false);
        vm.expectRevert("UNAUTHORIZED");
        pcvGuardian.withdrawERC20RatioToSafeAddress(
            address(pcvDeposit1),
            address(pcvDeposit2),
            address(token),
            1,
            false,
            false
        );
    }

    // should allow GOVERNOR to perform withdrawals
    // should allow PCV_SAFE_MOVER_ROLE to perform withdrawals
    // should allow GUARDIAN to perform withdrawals
    function testAccessControl4() public {
        // none of the following calls shall revert if access
        // control is properly checked for the various callers
        vm.startPrank(addresses.governorAddress);
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1, false, false);
        pcvGuardian.withdrawETHToSafeAddress(address(pcvDeposit1), payable(address(pcvDeposit2)), 1, false, false);
        pcvGuardian.withdrawERC20ToSafeAddress(
            address(pcvDeposit1),
            address(pcvDeposit2),
            address(token),
            1,
            false,
            false
        );
        pcvGuardian.withdrawRatioToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1, false, false);
        pcvGuardian.withdrawETHRatioToSafeAddress(address(pcvDeposit1), payable(address(pcvDeposit2)), 1, false, false);
        pcvGuardian.withdrawERC20RatioToSafeAddress(
            address(pcvDeposit1),
            address(pcvDeposit2),
            address(token),
            1,
            false,
            false
        );
        vm.stopPrank();

        vm.startPrank(addresses.pcvSafeMoverAddress);
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1, false, false);
        pcvGuardian.withdrawETHToSafeAddress(address(pcvDeposit1), payable(address(pcvDeposit2)), 1, false, false);
        pcvGuardian.withdrawERC20ToSafeAddress(
            address(pcvDeposit1),
            address(pcvDeposit2),
            address(token),
            1,
            false,
            false
        );
        pcvGuardian.withdrawRatioToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1, false, false);
        pcvGuardian.withdrawETHRatioToSafeAddress(address(pcvDeposit1), payable(address(pcvDeposit2)), 1, false, false);
        pcvGuardian.withdrawERC20RatioToSafeAddress(
            address(pcvDeposit1),
            address(pcvDeposit2),
            address(token),
            1,
            false,
            false
        );
        vm.stopPrank();

        vm.startPrank(addresses.guardianAddress);
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1, false, false);
        pcvGuardian.withdrawETHToSafeAddress(address(pcvDeposit1), payable(address(pcvDeposit2)), 1, false, false);
        pcvGuardian.withdrawERC20ToSafeAddress(
            address(pcvDeposit1),
            address(pcvDeposit2),
            address(token),
            1,
            false,
            false
        );
        pcvGuardian.withdrawRatioToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1, false, false);
        pcvGuardian.withdrawETHRatioToSafeAddress(address(pcvDeposit1), payable(address(pcvDeposit2)), 1, false, false);
        pcvGuardian.withdrawERC20RatioToSafeAddress(
            address(pcvDeposit1),
            address(pcvDeposit2),
            address(token),
            1,
            false,
            false
        );
        vm.stopPrank();

        // move back all tokens & eth
        vm.startPrank(addresses.governorAddress);
        pcvGuardian.withdrawETHRatioToSafeAddress(
            address(pcvDeposit2),
            payable(address(pcvDeposit1)),
            10000,
            false,
            false
        );
        pcvGuardian.withdrawERC20RatioToSafeAddress(
            address(pcvDeposit2),
            address(pcvDeposit1),
            address(token),
            10000,
            false,
            false
        );
        pcvDeposit1.deposit();
        pcvDeposit2.deposit();
        vm.stopPrank();
    }

    // check state changes & getters after set & unset
    function testStateConsistency1() public {
        address[] memory getSafeAddresses = pcvGuardian.getSafeAddresses();
        assertEq(getSafeAddresses.length, 2);
        assertEq(getSafeAddresses[0], address(pcvDeposit1));
        assertEq(getSafeAddresses[1], address(pcvDeposit2));
        assertEq(pcvGuardian.isSafeAddress(address(pcvDeposit1)), true);
        assertEq(pcvGuardian.isSafeAddress(address(pcvDeposit2)), true);
        assertEq(pcvGuardian.isSafeAddress(address(pcvDeposit3)), false);

        vm.prank(addresses.governorAddress);
        pcvGuardian.setSafeAddress(address(pcvDeposit3));

        getSafeAddresses = pcvGuardian.getSafeAddresses();
        assertEq(getSafeAddresses.length, 3);
        assertEq(getSafeAddresses[0], address(pcvDeposit1));
        assertEq(getSafeAddresses[1], address(pcvDeposit2));
        assertEq(getSafeAddresses[2], address(pcvDeposit3));
        assertEq(pcvGuardian.isSafeAddress(address(pcvDeposit1)), true);
        assertEq(pcvGuardian.isSafeAddress(address(pcvDeposit2)), true);
        assertEq(pcvGuardian.isSafeAddress(address(pcvDeposit3)), true);

        vm.prank(addresses.governorAddress);
        pcvGuardian.unsetSafeAddress(address(pcvDeposit3));

        getSafeAddresses = pcvGuardian.getSafeAddresses();
        assertEq(getSafeAddresses.length, 2);
        assertEq(getSafeAddresses[0], address(pcvDeposit1));
        assertEq(getSafeAddresses[1], address(pcvDeposit2));
        assertEq(pcvGuardian.isSafeAddress(address(pcvDeposit1)), true);
        assertEq(pcvGuardian.isSafeAddress(address(pcvDeposit2)), true);
        assertEq(pcvGuardian.isSafeAddress(address(pcvDeposit3)), false);
    }

    // can't set an already safe address
    // can't unset an already unsafe address
    function testStateConsistency2() public {
        address safeAddress = address(0x42);
        vm.startPrank(addresses.governorAddress);

        vm.expectRevert("PCVGuardian: not a safe address");
        pcvGuardian.unsetSafeAddress(safeAddress);

        pcvGuardian.setSafeAddress(safeAddress);

        vm.expectRevert("PCVGuardian: already a safe address");
        pcvGuardian.setSafeAddress(safeAddress);

        vm.stopPrank();
    }

    // withdrawals

    // should not be able to withdraw to a non-safe address
    function testOnlyWithdrawableToSafeAdress() public {
        vm.prank(addresses.guardianAddress);
        vm.expectRevert("PCVGuardian: address not whitelisted");
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit3), 1, false, true);

        vm.prank(addresses.pcvGuardianAdminAddress);
        pcvGuardian.setSafeAddress(address(pcvDeposit3));

        vm.startPrank(addresses.guardianAddress);
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit3), 1, false, true);
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit3), address(pcvDeposit1), 1, false, true);
        pcvGuardian.unsetSafeAddress(address(pcvDeposit3));
        vm.expectRevert("PCVGuardian: address not whitelisted");
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit3), 1, false, true);
        vm.stopPrank();
    }

    // should withdraw from a pcv deposit
    // should withdrawETH from a pcv deposit
    // should withdrawERC20 from a pcv deposit
    // should withdrawRatio from a pcv deposit
    // should withdrawETHRatio from a pcv deposit
    // should withdrawERC20Ratio from a pcv deposit
    function testWithdrawals() public {
        // initial state
        vm.startPrank(addresses.pcvSafeMoverAddress);
        assertEq(pcvDeposit1.balance(), 100e18);
        assertEq(pcvDeposit2.balance(), 0);
        assertEq(address(pcvDeposit1).balance, 1 ether);
        assertEq(address(pcvDeposit2).balance, 0);

        // withdrawals
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1e18, false, true);
        assertEq(pcvDeposit1.balance(), 99e18);
        assertEq(pcvDeposit2.balance(), 1e18);

        pcvGuardian.withdrawETHToSafeAddress(
            address(pcvDeposit1),
            payable(address(pcvDeposit2)),
            0.1 ether,
            false,
            false
        );
        assertEq(address(pcvDeposit1).balance, 0.9 ether);
        assertEq(address(pcvDeposit2).balance, 0.1 ether);

        pcvGuardian.withdrawERC20ToSafeAddress(
            address(pcvDeposit1),
            address(pcvDeposit2),
            address(token),
            1e18,
            false,
            true
        );
        assertEq(pcvDeposit1.balance(), 98e18);
        assertEq(pcvDeposit2.balance(), 2e18);

        // ratio withdrawals
        pcvGuardian.withdrawRatioToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 5000, false, true);
        assertEq(pcvDeposit1.balance(), 49e18);
        assertEq(pcvDeposit2.balance(), 51e18);

        pcvGuardian.withdrawETHRatioToSafeAddress(
            address(pcvDeposit1),
            payable(address(pcvDeposit2)),
            5000,
            false,
            false
        );
        assertEq(address(pcvDeposit1).balance, 0.45 ether);
        assertEq(address(pcvDeposit2).balance, 0.55 ether);

        pcvGuardian.withdrawERC20RatioToSafeAddress(
            address(pcvDeposit1),
            address(pcvDeposit2),
            address(token),
            5000,
            false,
            true
        );
        assertEq(pcvDeposit1.balance(), 24.5e18);
        assertEq(pcvDeposit2.balance(), 75.5e18);

        // transfer back all tokens & eth
        pcvGuardian.withdrawRatioToSafeAddress(address(pcvDeposit2), address(pcvDeposit1), 10000, false, true);
        pcvGuardian.withdrawETHRatioToSafeAddress(
            address(pcvDeposit2),
            payable(address(pcvDeposit1)),
            10000,
            false,
            false
        );
        vm.stopPrank();

        // end state = initial state
        assertEq(pcvDeposit1.balance(), 100e18);
        assertEq(pcvDeposit2.balance(), 0);
        assertEq(address(pcvDeposit1).balance, 1 ether);
        assertEq(address(pcvDeposit2).balance, 0);
    }

    // should withdraw and deposit after
    // should withdraw and not deposit after
    function testDepositAfter() public {
        vm.startPrank(addresses.guardianAddress);

        assertEq(pcvDeposit1._resistantBalance(), 100e18);
        assertEq(pcvDeposit2._resistantBalance(), 0);
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1e18, false, false);
        assertEq(pcvDeposit1._resistantBalance(), 99e18);
        assertEq(pcvDeposit2._resistantBalance(), 0);
        pcvDeposit2.deposit();
        assertEq(pcvDeposit2._resistantBalance(), 1e18);
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit2), address(pcvDeposit1), 1e18, false, true);
        assertEq(pcvDeposit1._resistantBalance(), 100e18);
        assertEq(pcvDeposit2._resistantBalance(), 0);

        vm.stopPrank();
    }

    // should withdraw and pause after
    // should withdraw and not pause after
    function testPauseAfter() public {
        vm.startPrank(addresses.guardianAddress);

        assertEq(pcvDeposit1.paused(), false);
        assertEq(pcvDeposit2.paused(), false);
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1e18, false, true);
        assertEq(pcvDeposit1.paused(), false);
        assertEq(pcvDeposit2.paused(), false);
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1e18, true, true);
        assertEq(pcvDeposit1.paused(), true);
        assertEq(pcvDeposit2.paused(), false);

        pcvDeposit1.unpause();
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit2), address(pcvDeposit1), 2e18, false, true);

        vm.stopPrank();
    }

    // should withdraw and unpause before
    // should withdraw, and pause after
    // should keep paused state if deposit was paused before withdraw
    function testUnpauseBefore() public {
        vm.startPrank(addresses.guardianAddress);

        pcvDeposit1.pause();
        assertEq(pcvDeposit1.paused(), true);
        assertEq(pcvDeposit2.paused(), false);
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1e18, false, true);
        assertEq(pcvDeposit1.paused(), true);
        assertEq(pcvDeposit2.paused(), false);
        pcvDeposit1.unpause();
        assertEq(pcvDeposit1.paused(), false);
        assertEq(pcvDeposit2.paused(), false);
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1e18, true, true);
        assertEq(pcvDeposit1.paused(), true);
        assertEq(pcvDeposit2.paused(), false);

        pcvDeposit1.unpause();
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit2), address(pcvDeposit1), 2e18, false, true);

        vm.stopPrank();
    }

    // should revert if trying to depositAfter on a paused safe address
    function testRevertPausedAfter() public {
        vm.startPrank(addresses.guardianAddress);
        pcvDeposit2.pause();
        vm.expectRevert("Pausable: paused");
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1e18, false, true);
        pcvDeposit2.unpause();
        vm.stopPrank();
    }
}
