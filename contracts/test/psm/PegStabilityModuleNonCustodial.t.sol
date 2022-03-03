pragma solidity ^0.8.4;

import {ERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import {MockPCVDepositV2} from "../../mock/MockPCVDepositV2.sol";
import {IPCVDeposit} from "../../pcv/IPCVDeposit.sol";
import {MockERC20} from "../../mock/MockERC20.sol";
import {MockOracle} from "../../mock/MockOracle.sol";
import {ICore} from "../../core/ICore.sol";
import {Core} from "../../core/Core.sol";
import {IFei, Fei} from "../../fei/Fei.sol";
import {NonCustodialPSM} from "./../../peg/NonCustodialPSM.sol";
import {PegStabilityModule} from "./../../peg/PegStabilityModule.sol";
import {Vm} from "./../utils/Vm.sol";
import {DSTest} from "./../utils/DSTest.sol";
import {getCore, getAddresses, FeiTestAddresses} from "./../utils/Fixtures.sol";

contract NonCustodialPSMTest is DSTest {
    NonCustodialPSM private psm;
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

        PegStabilityModule.MultiRateLimitedParams
            memory multiRateLimitedParams = PegStabilityModule
                .MultiRateLimitedParams({
                    maxRateLimitPerSecond: rps,
                    rateLimitPerSecond: rps,
                    individualMaxRateLimitPerSecond: rps,
                    individualMaxBufferCap: bufferCap - 1,
                    globalBufferCap: bufferCap
                });

        PegStabilityModule.PSMParams memory PSMParams = PegStabilityModule
            .PSMParams({
                mintFeeBasisPoints: 0,
                redeemFeeBasisPoints: 0,
                reservesThreshold: 0,
                feiLimitPerSecond: rps,
                mintingBufferCap: bufferCap,
                underlyingToken: underlyingToken,
                surplusTarget: pcvDeposit,
                feiRateLimitPerSecond: uint112(rps),
                feiBufferCap: uint144(bufferCap),
                underlyingTokenRateLimitPerSecond: uint112(rps),
                underlyingTokenBufferCap: uint144(bufferCap)
            });

        /// create PSM
        psm = new NonCustodialPSM(
            oracleParams,
            multiRateLimitedParams,
            PSMParams
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

    /// @notice pcv deposit gets depleted on redeem
    function testUnderlyingBufferDepletion() public {
        uint256 bufferStart = psm.individualBuffer(address(underlyingToken));

        fei.approve(address(psm), mintAmount);
        psm.redeem(address(this), mintAmount, mintAmount);

        uint256 bufferEnd = psm.individualBuffer(address(underlyingToken));
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
        assertEq(bufferStart, bufferCap);
        assertEq(bufferEnd, bufferCap - mintAmount);
    }

    /// @notice pcv deposit gets depleted on redeem
    function testFeiBufferDepletion() public {
        uint256 bufferStart = psm.individualBuffer(address(fei));

        underlyingToken.approve(address(psm), mintAmount);
        psm.mint(address(this), mintAmount, mintAmount);

        uint256 bufferEnd = psm.individualBuffer(address(fei));
        uint256 endingUserFEIBalance = fei.balanceOf(address(this));
        uint256 endingPSMUnderlyingBalance = psm.balance();
        uint256 endingPCVDepositUnderlyingBalance = underlyingToken.balanceOf(
            address(pcvDeposit)
        );

        assertEq(endingPCVDepositUnderlyingBalance, mintAmount * 2);
        assertEq(endingPSMUnderlyingBalance, 0);
        assertEq(endingUserFEIBalance, mintAmount * 2);

        assertEq(bufferStart, bufferCap);
        assertEq(bufferEnd, bufferCap - mintAmount);
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
