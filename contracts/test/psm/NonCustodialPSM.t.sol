pragma solidity ^0.8.4;

import {ERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import {MockPCVDepositV2} from "../../mock/MockPCVDepositV2.sol";
import {IPCVDeposit} from "../../pcv/IPCVDeposit.sol";
import {MockERC20} from "../../mock/MockERC20.sol";
import {MockOracle} from "../../mock/MockOracle.sol";
import {ICore} from "../../core/ICore.sol";
import {Core} from "../../core/Core.sol";
import {IFei, Fei} from "../../fei/Fei.sol";
import {NonCustodialPSM, GlobalRateLimitedMinter} from "./../../peg/NonCustodialPSM.sol";

import {PegStabilityModule} from "./../../peg/PegStabilityModule.sol";
import {Vm} from "./../utils/Vm.sol";
import {DSTest} from "./../utils/DSTest.sol";
import {getCore, getAddresses, FeiTestAddresses} from "./../utils/Fixtures.sol";

contract NonCustodialPSMTest is DSTest {
    GlobalRateLimitedMinter private rateLimitedMinter;
    NonCustodialPSM private psm;
    ICore private core;
    IFei private fei;

    uint256 public constant mintAmount = 10_000_000e18;
    uint256 public constant bufferCap = 10_000_000e18;
    uint256 public constant individualMaxBufferCap = 5_000_000e18;
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

        rateLimitedMinter = new GlobalRateLimitedMinter(
            address(core),
            rps,
            rps,
            rps,
            individualMaxBufferCap,
            bufferCap
        );

        NonCustodialPSM.OracleParams memory oracleParams = NonCustodialPSM
            .OracleParams({
                coreAddress: address(core),
                oracleAddress: address(oracle),
                backupOracle: address(0),
                decimalsNormalizer: 0,
                doInvert: false
            });

        NonCustodialPSM.RateLimitedParams
            memory multiRateLimitedParams = NonCustodialPSM.RateLimitedParams({
                maxRateLimitPerSecond: rps,
                rateLimitPerSecond: rps,
                bufferCap: bufferCap
            });

        NonCustodialPSM.PSMParams memory PSMParams = NonCustodialPSM.PSMParams({
            mintFeeBasisPoints: 0,
            redeemFeeBasisPoints: 0,
            feiLimitPerSecond: rps,
            mintingBufferCap: bufferCap,
            underlyingToken: underlyingToken,
            pcvDeposit: pcvDeposit,
            rateLimitedMinter: rateLimitedMinter,
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

        vm.startPrank(addresses.governorAddress);

        /// grant the PSM the PCV Controller role
        core.grantMinter(addresses.governorAddress);
        core.grantMinter(address(rateLimitedMinter));
        core.grantPCVController(address(psm));
        core.grantPCVController(addresses.governorAddress);
        rateLimitedMinter.addAddress(
            address(psm),
            uint112(rps),
            uint144(bufferCap)
        );

        /// mint FEI to the user
        fei.mint(address(this), mintAmount);

        vm.stopPrank();

        /// mint the PSM and user some underlying tokens
        underlyingToken.mint(address(pcvDeposit), mintAmount);
        underlyingToken.mint(address(this), mintAmount);

        /// invest all excess tokens in the PCV deposit
        pcvDeposit.deposit();
    }

    /// @notice PSM is set up correctly, all state variables and balances are correct
    function testPSMSetup() public {
        uint256 startingPSMUnderlyingBalance = underlyingToken.balanceOf(
            address(psm)
        );
        uint256 startingUserFEIBalance = fei.balanceOf(address(this));

        assertEq(startingPSMUnderlyingBalance, 0);
        assertEq(startingUserFEIBalance, mintAmount);

        assertTrue(core.isPCVController(address(psm)));
        assertTrue(core.isMinter(address(rateLimitedMinter)));
    }

    /// @notice pcv deposit receives underlying token on mint
    function testSwapUnderlyingForFei() public {
        underlyingToken.approve(address(psm), mintAmount);
        psm.mint(address(this), mintAmount, mintAmount);

        uint256 endingUserFEIBalance = fei.balanceOf(address(this));
        uint256 endingPSMUnderlyingBalance = underlyingToken.balanceOf(
            address(psm)
        );
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
        uint256 endingPSMUnderlyingBalance = underlyingToken.balanceOf(
            address(psm)
        );
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
        uint256 bufferStart = psm.buffer();

        fei.approve(address(psm), mintAmount);
        psm.redeem(address(this), mintAmount, mintAmount);

        uint256 bufferEnd = psm.buffer();
        uint256 endingUserFEIBalance = fei.balanceOf(address(this));
        uint256 endingUserUnderlyingBalance = underlyingToken.balanceOf(
            address(this)
        );
        uint256 endingPSMUnderlyingBalance = underlyingToken.balanceOf(
            address(psm)
        );
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

    /// @notice global rate limited minter buffer on the PSM gets depleted on mint
    function testFeiBufferDepletion() public {
        uint256 bufferStart = rateLimitedMinter.individualBuffer(address(psm));

        underlyingToken.approve(address(psm), mintAmount);
        psm.mint(address(this), mintAmount, mintAmount);

        uint256 bufferEnd = rateLimitedMinter.individualBuffer(address(psm));
        uint256 endingUserFEIBalance = fei.balanceOf(address(this));
        uint256 endingPSMUnderlyingBalance = underlyingToken.balanceOf(
            address(psm)
        );
        uint256 endingPCVDepositUnderlyingBalance = underlyingToken.balanceOf(
            address(pcvDeposit)
        );

        assertEq(endingPCVDepositUnderlyingBalance, mintAmount * 2);
        assertEq(endingPSMUnderlyingBalance, 0);
        assertEq(endingUserFEIBalance, mintAmount * 2);

        assertEq(bufferStart, bufferCap);
        assertEq(bufferEnd, bufferCap - mintAmount);
    }

    /// @notice replenishable rate limited minter buffer on the PSM gets increased on mint
    function testBufferReplenishment() public {
        /// drain buffer
        fei.approve(address(psm), mintAmount);
        psm.redeem(address(this), mintAmount, mintAmount);

        uint256 bufferStart = psm.bufferStored();

        underlyingToken.approve(address(psm), mintAmount);
        psm.mint(address(this), mintAmount, mintAmount);

        uint256 bufferEnd = psm.bufferStored();

        assertEq(bufferEnd - bufferStart, mintAmount);
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

    /// @notice withdraw erc20 fails without correct permissions
    function testERC20WithdrawFailure() public {
        vm.expectRevert(bytes("CoreRef: Caller is not a PCV controller"));

        psm.withdrawERC20(address(underlyingToken), address(this), 100);
    }

    /// @notice withdraw erc20 succeeds with correct permissions
    function testERC20WithdrawSuccess() public {
        vm.startPrank(addresses.governorAddress);

        core.grantPCVController(address(this));
        underlyingToken.mint(address(psm), mintAmount);

        vm.stopPrank();

        uint256 startingBalance = underlyingToken.balanceOf(address(this));
        psm.withdrawERC20(address(underlyingToken), address(this), mintAmount);
        uint256 endingBalance = underlyingToken.balanceOf(address(this));

        assertEq(endingBalance - startingBalance, mintAmount);
    }

    /// @notice set global rate limited minter fails when caller is not governor
    function testSetGlobalRateLimitedMinterFailure() public {
        vm.expectRevert(bytes("CoreRef: Caller is not a governor"));

        psm.setGlobalRateLimitedMinter(GlobalRateLimitedMinter(address(this)));
    }

    /// @notice set global rate limited minter fails when caller is governor and new address is 0
    function testSetGlobalRateLimitedMinterFailureZeroAddress() public {
        vm.startPrank(addresses.governorAddress);

        vm.expectRevert(
            bytes("PegStabilityModule: Invalid new GlobalRateLimitedMinter")
        );
        psm.setGlobalRateLimitedMinter(GlobalRateLimitedMinter(address(0)));

        vm.stopPrank();
    }

    /// @notice set global rate limited minter succeeds when caller is governor
    function testSetGlobalRateLimitedMinterSuccess() public {
        vm.startPrank(addresses.governorAddress);

        psm.setGlobalRateLimitedMinter(GlobalRateLimitedMinter(address(this)));

        assertEq(address(psm.rateLimitedMinter()), address(this));

        vm.stopPrank();
    }

    /// @notice set global rate limited minter fails when caller is governor and new address is 0
    function testSetPCVDepositFailureZeroAddress() public {
        vm.startPrank(addresses.governorAddress);

        vm.expectRevert(bytes("PegStabilityModule: Invalid new PCVDeposit"));
        psm.setPCVDeposit(IPCVDeposit(address(0)));

        vm.stopPrank();
    }

    /// @notice set global rate limited minter fails when caller is governor and new address is 0
    function testSetPCVDepositFailureNonGovernor() public {
        vm.expectRevert(bytes("CoreRef: Caller is not a governor"));
        psm.setPCVDeposit(IPCVDeposit(address(0)));
    }

    /// @notice set global rate limited minter fails when caller is governor and new address is 0
    function testSetPCVDepositFailureUnderlyingTokenMismatch() public {
        vm.startPrank(addresses.governorAddress);

        MockPCVDepositV2 newPCVDeposit = new MockPCVDepositV2(
            address(core),
            address(fei),
            0,
            0
        );

        vm.expectRevert(bytes("PegStabilityModule: Underlying token mismatch"));

        psm.setPCVDeposit(IPCVDeposit(address(newPCVDeposit)));

        vm.stopPrank();
    }

    /// @notice set PCV Deposit succeeds when caller is governor and underlying tokens match
    function testSetPCVDepositSuccess() public {
        vm.startPrank(addresses.governorAddress);

        MockPCVDepositV2 newPCVDeposit = new MockPCVDepositV2(
            address(core),
            address(underlyingToken),
            0,
            0
        );

        psm.setPCVDeposit(IPCVDeposit(address(newPCVDeposit)));

        vm.stopPrank();

        assertEq(address(newPCVDeposit), address(psm.pcvDeposit()));
    }
}
