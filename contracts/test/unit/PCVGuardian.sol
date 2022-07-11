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
        vm.startPrank(addresses.governor);
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
    function testDeployWithoutSafeAddresses() public {
        address[] memory safeAddresses = new address[](0);
        PCVGuardian pcvGuardianWithoutAddresses = new PCVGuardian(address(core), safeAddresses);
        address[] memory getSafeAddresses = pcvGuardianWithoutAddresses.getSafeAddresses();
        assertEq(getSafeAddresses.length, 0);
    }

    // should have safe addresses upon deployment when deployed with safe addresses
    function testDeployWithSafeAddresses() public {
        address[] memory safeAddresses = new address[](1);
        safeAddresses[0] = address(0x42);
        PCVGuardian pcvGuardianWithoutAddresses = new PCVGuardian(address(core), safeAddresses);
        address[] memory getSafeAddresses = pcvGuardianWithoutAddresses.getSafeAddresses();
        assertEq(getSafeAddresses.length, 1);
        assertEq(getSafeAddresses[0], address(0x42));
    }

    ///////////// ACCESS CONTROL AND STATE CHANGES //////////

    // should revert when calling setSafeAddress & setSafeAddresses from a non-privileged address
    // should revert when calling unsetSafeAddress & unsetSafeAddresses from a non-privileged address
    function testAccessControlSetUnsetSafeAddressesUnprivilegedCaller() public {
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
    function testAccessControlSetUnsetSafeAddressesPrivilegedCallers() public {
        address safeAddress = address(0x42);
        address[] memory safeAddresses = new address[](1);
        safeAddresses[0] = safeAddress;

        // none of the following calls shall revert if access
        // control is properly checked for the various callers
        vm.startPrank(addresses.pcvGuardianAdmin);
        pcvGuardian.setSafeAddress(safeAddress);
        pcvGuardian.unsetSafeAddress(safeAddress);
        pcvGuardian.setSafeAddresses(safeAddresses);
        pcvGuardian.unsetSafeAddresses(safeAddresses);
        vm.stopPrank();

        vm.startPrank(addresses.governor);
        pcvGuardian.setSafeAddress(safeAddress);
        pcvGuardian.unsetSafeAddress(safeAddress);
        pcvGuardian.setSafeAddresses(safeAddresses);
        pcvGuardian.unsetSafeAddresses(safeAddresses);
        vm.stopPrank();

        vm.prank(addresses.pcvGuardianAdmin);
        pcvGuardian.setSafeAddress(safeAddress);
        vm.prank(addresses.guardian);
        pcvGuardian.unsetSafeAddress(safeAddress);
        vm.prank(addresses.pcvGuardianAdmin);
        pcvGuardian.setSafeAddresses(safeAddresses);
        vm.prank(addresses.guardian);
        pcvGuardian.unsetSafeAddresses(safeAddresses);
    }

    // should revert when calling withdrawToSafeAddress from a non-privileged address
    // should revert when calling withdrawETHToSafeAddress from a non-privileged address
    // should revert when calling withdrawERC20ToSafeAddress from a non-privileged address
    // should revert when calling withdrawRatioToSafeAddress from a non-privileged address
    // should revert when calling withdrawETHRatioToSafeAddress from a non-privileged address
    // should revert when calling withdrawERC20RatioToSafeAddress from a non-privileged address
    function testAccessControlWithdrawalsUnprivilegedCaller() public {
        vm.expectRevert("UNAUTHORIZED");
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1e18, false);
        vm.expectRevert("UNAUTHORIZED");
        pcvGuardian.withdrawETHToSafeAddress(address(pcvDeposit1), payable(address(pcvDeposit2)), 1e18, false);
        vm.expectRevert("UNAUTHORIZED");
        pcvGuardian.withdrawERC20ToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), address(token), 1e18, false);
        vm.expectRevert("UNAUTHORIZED");
        pcvGuardian.withdrawRatioToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1, false);
        vm.expectRevert("UNAUTHORIZED");
        pcvGuardian.withdrawETHRatioToSafeAddress(address(pcvDeposit1), payable(address(pcvDeposit2)), 1, false);
        vm.expectRevert("UNAUTHORIZED");
        pcvGuardian.withdrawERC20RatioToSafeAddress(
            address(pcvDeposit1),
            address(pcvDeposit2),
            address(token),
            1,
            false
        );
    }

    // should allow GOVERNOR to perform withdrawals
    // should allow PCV_SAFE_MOVER_ROLE to perform withdrawals
    // should allow GUARDIAN to perform withdrawals
    function testAccessControlWithdrawalsPrivilegedCallers() public {
        // none of the following calls shall revert if access
        // control is properly checked for the various callers
        vm.startPrank(addresses.governorAddress);
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1, false);
        pcvGuardian.withdrawETHToSafeAddress(address(pcvDeposit1), payable(address(pcvDeposit2)), 1, false);
        pcvGuardian.withdrawERC20ToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), address(token), 1, false);
        pcvGuardian.withdrawRatioToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1, false);
        pcvGuardian.withdrawETHRatioToSafeAddress(address(pcvDeposit1), payable(address(pcvDeposit2)), 1, false);
        pcvGuardian.withdrawERC20RatioToSafeAddress(
            address(pcvDeposit1),
            address(pcvDeposit2),
            address(token),
            1,
            false
        );
        vm.stopPrank();

        vm.startPrank(addresses.pcvSafeMover);
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1, false);
        pcvGuardian.withdrawETHToSafeAddress(address(pcvDeposit1), payable(address(pcvDeposit2)), 1, false);
        pcvGuardian.withdrawERC20ToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), address(token), 1, false);
        pcvGuardian.withdrawRatioToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1, false);
        pcvGuardian.withdrawETHRatioToSafeAddress(address(pcvDeposit1), payable(address(pcvDeposit2)), 1, false);
        pcvGuardian.withdrawERC20RatioToSafeAddress(
            address(pcvDeposit1),
            address(pcvDeposit2),
            address(token),
            1,
            false
        );
        vm.stopPrank();

        vm.startPrank(addresses.guardianAddress);
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1, false);
        pcvGuardian.withdrawETHToSafeAddress(address(pcvDeposit1), payable(address(pcvDeposit2)), 1, false);
        pcvGuardian.withdrawERC20ToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), address(token), 1, false);
        pcvGuardian.withdrawRatioToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1, false);
        pcvGuardian.withdrawETHRatioToSafeAddress(address(pcvDeposit1), payable(address(pcvDeposit2)), 1, false);
        pcvGuardian.withdrawERC20RatioToSafeAddress(
            address(pcvDeposit1),
            address(pcvDeposit2),
            address(token),
            1,
            false
        );
        vm.stopPrank();

        // move back all tokens & eth
        vm.startPrank(addresses.governorAddress);
        pcvGuardian.withdrawETHRatioToSafeAddress(address(pcvDeposit2), payable(address(pcvDeposit1)), 10000, false);
        pcvGuardian.withdrawERC20RatioToSafeAddress(
            address(pcvDeposit2),
            address(pcvDeposit1),
            address(token),
            10000,
            false
        );
        pcvDeposit1.deposit();
        pcvDeposit2.deposit();
        vm.stopPrank();
    }

    // check state changes & getters after set & unset
    function testIsSafeAddress() public {
        assertEq(pcvGuardian.isSafeAddress(address(pcvDeposit1)), true);
        assertEq(pcvGuardian.isSafeAddress(address(pcvDeposit2)), true);
        assertEq(pcvGuardian.isSafeAddress(address(pcvDeposit3)), false);

        vm.prank(addresses.governor);
        pcvGuardian.setSafeAddress(address(pcvDeposit3));

        assertEq(pcvGuardian.isSafeAddress(address(pcvDeposit1)), true);
        assertEq(pcvGuardian.isSafeAddress(address(pcvDeposit2)), true);
        assertEq(pcvGuardian.isSafeAddress(address(pcvDeposit3)), true);

        vm.prank(addresses.governor);
        pcvGuardian.unsetSafeAddress(address(pcvDeposit3));

        assertEq(pcvGuardian.isSafeAddress(address(pcvDeposit1)), true);
        assertEq(pcvGuardian.isSafeAddress(address(pcvDeposit2)), true);
        assertEq(pcvGuardian.isSafeAddress(address(pcvDeposit3)), false);
    }

    // check state changes & getters after set & unset
    function testGetSafeAddresses() public {
        address[] memory getSafeAddresses = pcvGuardian.getSafeAddresses();
        assertEq(getSafeAddresses.length, 2);
        assertEq(getSafeAddresses[0], address(pcvDeposit1));
        assertEq(getSafeAddresses[1], address(pcvDeposit2));

        vm.prank(addresses.governor);
        pcvGuardian.setSafeAddress(address(pcvDeposit3));

        getSafeAddresses = pcvGuardian.getSafeAddresses();
        assertEq(getSafeAddresses.length, 3);
        assertEq(getSafeAddresses[0], address(pcvDeposit1));
        assertEq(getSafeAddresses[1], address(pcvDeposit2));
        assertEq(getSafeAddresses[2], address(pcvDeposit3));

        vm.prank(addresses.governor);
        pcvGuardian.unsetSafeAddress(address(pcvDeposit3));

        getSafeAddresses = pcvGuardian.getSafeAddresses();
        assertEq(getSafeAddresses.length, 2);
        assertEq(getSafeAddresses[0], address(pcvDeposit1));
        assertEq(getSafeAddresses[1], address(pcvDeposit2));
    }

    // can't set an already safe address
    function testSetAlreadySafeAddress() public {
        vm.prank(addresses.governor);
        vm.expectRevert("PCVGuardian: already a safe address");
        pcvGuardian.setSafeAddress(address(pcvDeposit1));
    }

    // can't unset an already unsafe address
    function testUnsetUnsafeAddress() public {
        vm.prank(addresses.governor);
        vm.expectRevert("PCVGuardian: not a safe address");
        pcvGuardian.unsetSafeAddress(address(pcvDeposit3));
    }

    ///////////// WITHDRAWALS //////////

    // should not be able to withdraw to a non-safe address
    function testOnlyWithdrawableToSafeAdress() public {
        vm.prank(addresses.guardian);
        vm.expectRevert("PCVGuardian: address not whitelisted");
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit3), 1, true);

        vm.prank(addresses.pcvGuardianAdmin);
        pcvGuardian.setSafeAddress(address(pcvDeposit3));

        vm.startPrank(addresses.guardian);
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit3), 1, true);
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit3), address(pcvDeposit1), 1, true);
        pcvGuardian.unsetSafeAddress(address(pcvDeposit3));
        vm.expectRevert("PCVGuardian: address not whitelisted");
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit3), 1, true);
        vm.stopPrank();
    }

    // should withdraw from a pcv deposit
    function testWithdrawToSafeAddress() public {
        assertEq(pcvDeposit1.balance(), 100e18);
        assertEq(pcvDeposit2.balance(), 0);
        vm.prank(addresses.pcvSafeMover);
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1e18, true);
        assertEq(pcvDeposit1.balance(), 99e18);
        assertEq(pcvDeposit2.balance(), 1e18);
    }

    // should withdrawETH from a pcv deposit
    function testWithdrawETHToSafeAddress() public {
        assertEq(address(pcvDeposit1).balance, 1 ether);
        assertEq(address(pcvDeposit2).balance, 0);
        vm.prank(addresses.pcvSafeMover);
        pcvGuardian.withdrawETHToSafeAddress(address(pcvDeposit1), payable(address(pcvDeposit2)), 0.1 ether, false);
        assertEq(address(pcvDeposit1).balance, 0.9 ether);
        assertEq(address(pcvDeposit2).balance, 0.1 ether);
    }

    // should withdrawERC20 from a pcv deposit
    function testWithdrawERC20ToSafeAddress() public {
        assertEq(pcvDeposit1.balance(), 100e18);
        assertEq(pcvDeposit2.balance(), 0);
        vm.prank(addresses.pcvSafeMover);
        pcvGuardian.withdrawERC20ToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), address(token), 1e18, true);
        assertEq(pcvDeposit1.balance(), 99e18);
        assertEq(pcvDeposit2.balance(), 1e18);
    }

    // should withdrawRatio from a pcv deposit
    function testWithdrawRatioToSafeAddress() public {
        assertEq(pcvDeposit1.balance(), 100e18);
        assertEq(pcvDeposit2.balance(), 0);
        vm.prank(addresses.pcvSafeMover);
        pcvGuardian.withdrawRatioToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 5500, true);
        assertEq(pcvDeposit1.balance(), 45e18);
        assertEq(pcvDeposit2.balance(), 55e18);
    }

    // should withdrawETHRatio from a pcv deposit
    function testWithdrawETHRatioToSafeAddress() public {
        assertEq(address(pcvDeposit1).balance, 1 ether);
        assertEq(address(pcvDeposit2).balance, 0);
        vm.prank(addresses.pcvSafeMover);
        pcvGuardian.withdrawETHRatioToSafeAddress(address(pcvDeposit1), payable(address(pcvDeposit2)), 5500, false);
        assertEq(address(pcvDeposit1).balance, 0.45 ether);
        assertEq(address(pcvDeposit2).balance, 0.55 ether);
    }

    // should withdrawERC20Ratio from a pcv deposit
    function testWithdrawERC20RatioToSafeAddress() public {
        assertEq(pcvDeposit1.balance(), 100e18);
        assertEq(pcvDeposit2.balance(), 0);
        vm.prank(addresses.pcvSafeMover);
        pcvGuardian.withdrawERC20RatioToSafeAddress(
            address(pcvDeposit1),
            address(pcvDeposit2),
            address(token),
            6700,
            true
        );
        assertEq(pcvDeposit1.balance(), 33e18);
        assertEq(pcvDeposit2.balance(), 67e18);
    }

    // should withdraw and deposit after
    // should withdraw and not deposit after
    function testDepositAfter() public {
        vm.startPrank(addresses.guardian);

        assertEq(pcvDeposit1._resistantBalance(), 100e18);
        assertEq(pcvDeposit2._resistantBalance(), 0);
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1e18, false);
        assertEq(pcvDeposit1._resistantBalance(), 99e18);
        assertEq(pcvDeposit2._resistantBalance(), 0);
        pcvDeposit2.deposit();
        assertEq(pcvDeposit2._resistantBalance(), 1e18);
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit2), address(pcvDeposit1), 1e18, true);
        assertEq(pcvDeposit1._resistantBalance(), 100e18);
        assertEq(pcvDeposit2._resistantBalance(), 0);

        vm.stopPrank();
    }

    // should revert if trying to depositAfter on a paused safe address
    function testRevertPausedDepositAfter() public {
        vm.startPrank(addresses.guardian);
        pcvDeposit2.pause();
        vm.expectRevert("Pausable: paused");
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1e18, true);
        pcvDeposit2.unpause();
        vm.stopPrank();
    }

    // should withdraw and unpause before, if the source deposit is paused,
    // then re-pause it after withdrawal if it was paused
    function testKeepPausedState() public {
        vm.startPrank(addresses.guardian);

        pcvDeposit1.pause();
        assertEq(pcvDeposit1.paused(), true);
        assertEq(pcvDeposit2.paused(), false);
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1e18, true);
        assertEq(pcvDeposit1.paused(), true);
        assertEq(pcvDeposit2.paused(), false);
        pcvDeposit1.unpause();
        assertEq(pcvDeposit1.paused(), false);
        assertEq(pcvDeposit2.paused(), false);
        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit1), address(pcvDeposit2), 1e18, true);
        assertEq(pcvDeposit1.paused(), false);
        assertEq(pcvDeposit2.paused(), false);

        pcvGuardian.withdrawToSafeAddress(address(pcvDeposit2), address(pcvDeposit1), 2e18, true);

        vm.stopPrank();
    }
}
