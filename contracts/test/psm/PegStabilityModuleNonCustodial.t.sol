pragma solidity ^0.8.4;

import {ERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import {MockPCVDepositV2} from "../../mock/MockPCVDepositV2.sol";
import {IPCVDeposit} from "../../pcv/IPCVDeposit.sol";
import {MockERC20} from "../../mock/MockERC20.sol";
import {MockOracle} from "../../mock/MockOracle.sol";
import {ICore} from "../../core/ICore.sol";
import {Core} from "../../core/Core.sol";
import {IFei, Fei} from "../../fei/Fei.sol";
import {PegStabilityModuleNonCustodial} from "./../../peg/PegStabilityModuleNonCustodial.sol";
import {PegStabilityModule} from "./../../peg/PegStabilityModule.sol";
import {Vm} from "./../utils/Vm.sol";
import {DSTest} from "./../utils/DSTest.sol";
import {getCore, getAddresses, FeiTestAddresses} from "./../utils/Fixtures.sol";

contract PegStabilityModuleNonCustodialTest is DSTest {
    PegStabilityModuleNonCustodial private psm;
    ICore private core;
    IFei private fei;

    uint256 public constant mintAmount = 10_000_000e18;
    uint256 public constant bufferCap = 10_000_000e18;
    uint256 public constant rps = 10_000e18;

    uint256 public constant floorBasisPoints = 9_900;
    uint256 public constant ceilingBasisPoints = 10_100;

    MockERC20 public underlyingToken;
    MockPCVDepositV2 public pcvDeposit;
    MockOracle public oracle;

    Vm public constant vm = Vm(HEVM_ADDRESS);
    FeiTestAddresses public addresses = getAddresses();

    function setUp() public {
        core = getCore();

        fei = core.fei();

        oracle = new MockOracle(1);
        underlyingToken = new MockERC20();
        pcvDeposit = new MockPCVDepositV2(
            address(core),
            address(underlyingToken),
            0,
            0
        );

        PegStabilityModule.OracleParams memory oracleParams = PegStabilityModule
            .OracleParams({
                coreAddress: address(core),
                oracleAddress: address(oracle),
                backupOracle: address(0),
                decimalsNormalizer: 0,
                doInvert: false
            });

        /// create PSM
        psm = new PegStabilityModuleNonCustodial(
            floorBasisPoints,
            ceilingBasisPoints,
            oracleParams,
            0,
            0,
            rps,
            bufferCap,
            IERC20(underlyingToken),
            IPCVDeposit(pcvDeposit)
        );

        /// mint the PSM and user some underlying tokens
        underlyingToken.mint(address(psm), mintAmount);
        underlyingToken.mint(address(this), mintAmount);

        vm.startPrank(addresses.governorAddress);

        /// give the PSM minting abilities
        core.grantMinter(addresses.governorAddress);
        core.grantPCVController(address(psm));
        core.grantMinter(address(psm));

        /// mint FEI to the user
        fei.mint(address(this), mintAmount);

        vm.stopPrank();

        /// send all excess tokens to the PCV deposit
        psm.allocateSurplus();
    }

    /// @notice PSM is set up correctly, all state variables and balances are correct
    function testPSMSetup() public {
        uint256 startingPSMUnderlyingBalance = psm.balance();
        uint256 startingUserFEIBalance = fei.balanceOf(address(this));
        uint256 reserveThreshold = psm.reservesThreshold();

        assertEq(reserveThreshold, 0);
        assertEq(startingPSMUnderlyingBalance, 0);
        assertEq(startingUserFEIBalance, mintAmount);

        assertTrue(core.isPCVController(address(psm)));
        assertTrue(core.isMinter(address(psm)));
    }

    /// @notice pcv deposit receives underlying token on mint
    function testSwapUnderlyingForFei() public {
        underlyingToken.approve(address(psm), mintAmount);
        psm.mint(address(this), mintAmount, mintAmount);

        uint256 endingUserFEIBalance = fei.balanceOf(address(this));
        uint256 endingPSMUnderlyingBalance = psm.balance();
        uint256 endingPCVDepositUnderlyingBalance = underlyingToken.balanceOf(
            address(pcvDeposit)
        );

        assertEq(endingPCVDepositUnderlyingBalance, mintAmount * 2);
        assertEq(endingPSMUnderlyingBalance, 0);
        assertEq(endingUserFEIBalance, mintAmount * 2);
    }

    /// @notice pcv deposit gets depleted on redeem
    function testSwapFeiForUnderlying() public {
        fei.approve(address(psm), mintAmount);
        psm.redeem(address(this), mintAmount, mintAmount);

        uint256 endingUserFEIBalance = fei.balanceOf(address(this));
        uint256 endingUserUnderlyingBalance = underlyingToken.balanceOf(
            address(this)
        );
        uint256 endingPSMUnderlyingBalance = psm.balance();
        uint256 endingPCVDepositUnderlyingBalance = underlyingToken.balanceOf(
            address(pcvDeposit)
        );

        assertEq(endingPSMUnderlyingBalance, 0);
        assertEq(endingUserFEIBalance, 0);
        assertEq(endingUserUnderlyingBalance, mintAmount * 2);
        assertEq(endingPCVDepositUnderlyingBalance, 0);
    }

    /// @notice redeem fails when price is out of bounds
    function testMintFailsAboveCeiling() public {
        oracle.setExchangeRate(2);
        vm.expectRevert(bytes("PegStabilityModule: price out of bounds"));

        psm.mint(address(this), mintAmount, mintAmount);
    }

    /// @notice mint fails when price is out of bounds
    function testMintFailsBelowFloor() public {
        oracle.setExchangeRateScaledBase(95e16);
        vm.expectRevert(bytes("PegStabilityModule: price out of bounds"));

        psm.mint(address(this), mintAmount, mintAmount);
    }

    /// @notice redeem fails when price is out of bounds
    function testRedeemFailsBelowFloor() public {
        oracle.setExchangeRateScaledBase(95e16);
        vm.expectRevert(bytes("PegStabilityModule: price out of bounds"));

        psm.redeem(address(this), mintAmount, mintAmount);
    }

    /// @notice redeem fails when price is out of bounds
    function testRedeemFailsAboveCeiling() public {
        oracle.setExchangeRate(2);
        vm.expectRevert(bytes("PegStabilityModule: price out of bounds"));

        psm.redeem(address(this), mintAmount, mintAmount);
    }

    /// @notice redeem fails without approval
    function testSwapFeiForUnderlyingFailsWithoutApproval() public {
        vm.expectRevert(bytes("ERC20: insufficient allowance"));

        psm.redeem(address(this), mintAmount, mintAmount);
    }

    /// @notice mint fails without approval
    function testSwapUnderlyingForFeiFailsWithoutApproval() public {
        vm.expectRevert(bytes("ERC20: insufficient allowance"));

        psm.mint(address(this), mintAmount, mintAmount);
    }

    /// @notice allocate fails without underlying token balance
    function testAllocateFailure() public {
        vm.expectRevert(bytes("PegStabilityModule: No balance to allocate"));

        psm.allocateSurplus();
    }

    /// @notice deposit fails without underlying token balance
    function testDepositFailure() public {
        vm.expectRevert(bytes("PegStabilityModule: No balance to allocate"));

        psm.deposit();
    }

    /// @notice deposit succeeds with underlying token balance and sends to PCV Deposit
    function testDepositSuccess() public {
        underlyingToken.mint(address(psm), mintAmount);

        psm.deposit();

        assertEq(underlyingToken.balanceOf(address(psm)), 0);
        assertEq(
            underlyingToken.balanceOf(address(pcvDeposit)),
            mintAmount * 2
        );
    }

    /// @notice allocate surplus succeeds with underlying token balance and sends to PCV Deposit
    function testAllocateSuccess() public {
        underlyingToken.mint(address(psm), mintAmount);

        psm.allocateSurplus();

        assertEq(underlyingToken.balanceOf(address(psm)), 0);
        assertEq(
            underlyingToken.balanceOf(address(pcvDeposit)),
            mintAmount * 2
        );
    }
}
