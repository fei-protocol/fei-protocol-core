pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {Vm} from "../../utils/Vm.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {CurveSwapper} from "../../../pcv/curve/CurveSwapper.sol";
import {Core} from "../../../core/Core.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";

contract CurveSwapperIntegrationTest is DSTest {
    Vm public constant vm = Vm(HEVM_ADDRESS);
    address payable receiver = payable(address(3));

    Core private core = Core(MainnetAddresses.CORE);

    CurveSwapper private curveSwapper;

    // dummy function to avoid errors
    // the CurveSwapper will call deposit() on the
    // tokenReceivingAddress after performing a swap
    function deposit() public {}

    // Deploy
    function setUp() public {
        curveSwapper = new CurveSwapper(
            address(core), // core
            MainnetAddresses.CURVE_LUSD_METAPOOL, // curvePool
            MainnetAddresses.LUSD, // tokenSpent
            MainnetAddresses.DAI, // tokenReceived
            address(this), // tokenReceivingAddress
            10000 // maxSlippageBps
        );

        vm.label(address(this), "test");
        vm.label(MainnetAddresses.CURVE_LUSD_METAPOOL, "CURVE_LUSD_METAPOOL");
        vm.label(MainnetAddresses.LUSD, "LUSD");
        vm.label(MainnetAddresses.DAI, "DAI");
        vm.label(MainnetAddresses.GUARDIAN_MULTISIG, "GUARDIAN_MULTISIG");
        vm.label(MainnetAddresses.FEI_DAO_TIMELOCK, "FEI_DAO_TIMELOCK");
    }

    // Check deployed contract & getters for public properties
    function testInit() public {
        assertEq(curveSwapper.curvePool(), MainnetAddresses.CURVE_LUSD_METAPOOL);
        assertEq(curveSwapper.tokenSpent(), MainnetAddresses.LUSD);
        assertEq(curveSwapper.tokenReceived(), MainnetAddresses.DAI);
        assertEq(curveSwapper.maxSlippageBps(), 10000);
        assertEq(curveSwapper.tokenReceivingAddress(), address(this));
        assertEq(curveSwapper.i(), 0);
        assertEq(curveSwapper.j(), 1);
    }

    // ------------- Access Control -------------

    function testSwapAccessControl() public {
        vm.expectRevert(bytes("UNAUTHORIZED"));
        curveSwapper.swap();
    }

    function testWithdrawERC20AccessControl() public {
        vm.expectRevert(bytes("CoreRef: Caller is not a PCV controller"));
        curveSwapper.withdrawERC20(MainnetAddresses.DAI, address(this), 1e18);
    }

    function testSetReceivingAddressAccessControl() public {
        vm.expectRevert(bytes("UNAUTHORIZED"));
        curveSwapper.setReceivingAddress(address(this));
    }

    function testSetMaximumSlippageAccessControl() public {
        vm.expectRevert(bytes("UNAUTHORIZED"));
        curveSwapper.setMaximumSlippage(10000);
    }

    // --------------- Pausable -----------------

    function testSwapPausable() public {
        vm.prank(MainnetAddresses.GUARDIAN_MULTISIG);
        curveSwapper.pause();
        vm.prank(MainnetAddresses.FEI_DAO_TIMELOCK);
        vm.expectRevert(bytes("Pausable: paused"));
        curveSwapper.swap();
    }

    // -------------- Functions -----------------

    function testSwap() public {
        // swapper and target should start empty
        assertEq(IERC20(MainnetAddresses.LUSD).balanceOf(address(curveSwapper)), 0);
        assertEq(IERC20(MainnetAddresses.DAI).balanceOf(address(this)), 0);

        // fund swapper
        address lusdHolder = 0x66017D22b0f8556afDd19FC67041899Eb65a21bb;
        vm.prank(lusdHolder);
        IERC20(MainnetAddresses.LUSD).transfer(address(curveSwapper), 100000 ether);
        assertEq(IERC20(MainnetAddresses.LUSD).balanceOf(address(curveSwapper)), 100000 ether);

        // swap
        vm.prank(MainnetAddresses.FEI_DAO_TIMELOCK);
        curveSwapper.swap();

        // check
        assertEq(IERC20(MainnetAddresses.LUSD).balanceOf(address(curveSwapper)), 0);
        assertGt(IERC20(MainnetAddresses.DAI).balanceOf(address(this)), 97500 ether);
    }
}
