pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {Vm} from "../../utils/Vm.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {AngleEuroRedeemer} from "../../../pcv/angle/AngleEuroRedeemer.sol";
import {Core} from "../../../core/Core.sol";
import {MockERC20} from "../../../mock/MockERC20.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../utils/Fixtures.sol";

contract AngleEuroRedeemerIntegrationTest is DSTest {
    Vm public constant vm = Vm(HEVM_ADDRESS);

    address public AGEUR_HOLDER = address(0x735a26a57A0A0069dfABd41595A970faF5E1ee8b);
    address public ANGLE_POOLMANAGER_USDC = address(0xe9f183FC656656f1F17af1F2b0dF79b8fF9ad8eD);

    IERC20 ageur = IERC20(MainnetAddresses.AGEUR);
    IERC20 dai = IERC20(MainnetAddresses.DAI);
    IERC20 usdc = IERC20(MainnetAddresses.USDC);

    /// @notice Validate a full redeem flow
    function testRedeemWorks() public {
        AngleEuroRedeemer redeemer = new AngleEuroRedeemer(MainnetAddresses.CORE);

        // seed redeemer with agEUR
        vm.prank(AGEUR_HOLDER);
        ageur.transfer(address(redeemer), 1e24);

        // redeem
        uint256 daiBalanceBefore = dai.balanceOf(redeemer.TRIBEDAO_FEI_DAI_PSM());
        vm.prank(MainnetAddresses.FEI_DAO_TIMELOCK);
        redeemer.redeem();
        uint256 daiRedeemed = dai.balanceOf(redeemer.TRIBEDAO_FEI_DAI_PSM()) - daiBalanceBefore;
        assertGt(daiRedeemed, 0.9e24);

        assertEq(ageur.balanceOf(address(redeemer)), 0);
    }

    /// @notice Validate a partial redeem flow
    function testPartialRedeem() public {
        AngleEuroRedeemer redeemer = new AngleEuroRedeemer(MainnetAddresses.CORE);

        // read amount of USDC available to redeem
        uint256 usdcBalanceAvailable = usdc.balanceOf(ANGLE_POOLMANAGER_USDC);

        // seed redeemer with agEUR
        vm.prank(AGEUR_HOLDER);
        ageur.transfer(address(redeemer), usdcBalanceAvailable * 1e12);

        // redeem
        // 1 agEUR is worth more than 1 USDC, so there should be some agEUR left
        // on the contract after this redeem call
        uint256 daiBalanceBefore = dai.balanceOf(redeemer.TRIBEDAO_FEI_DAI_PSM());
        vm.prank(MainnetAddresses.FEI_DAO_TIMELOCK);
        redeemer.redeem();
        uint256 daiRedeemed = dai.balanceOf(redeemer.TRIBEDAO_FEI_DAI_PSM()) - daiBalanceBefore;
        // test all USDC is redeemed to DAI (1% slippage tolerance)
        assertGt(daiRedeemed, (usdcBalanceAvailable * 1e12 * 99) / 100);
        // test the contract is still holding some agEUR
        assertGt(ageur.balanceOf(address(redeemer)), 0);
    }

    /// @notice Test access control on the public functions
    function testAccessControl() public {
        AngleEuroRedeemer redeemer = new AngleEuroRedeemer(MainnetAddresses.CORE);

        vm.expectRevert(bytes("UNAUTHORIZED"));
        redeemer.redeem();

        vm.expectRevert(bytes("UNAUTHORIZED"));
        redeemer.withdrawERC20(MainnetAddresses.AGEUR);
    }

    /// @notice Test guardian and TC timelock can recover agEUR if it's stuck on the contract
    function testRecoverFunds() public {
        AngleEuroRedeemer redeemer = new AngleEuroRedeemer(MainnetAddresses.CORE);

        // Guardian can move to TC Timelock
        vm.prank(AGEUR_HOLDER);
        ageur.transfer(address(redeemer), 1e18);
        uint256 balanceBefore = ageur.balanceOf(MainnetAddresses.TRIBAL_COUNCIL_TIMELOCK);
        vm.prank(MainnetAddresses.GUARDIAN_MULTISIG);
        redeemer.withdrawERC20(MainnetAddresses.AGEUR);
        assertEq(ageur.balanceOf(MainnetAddresses.TRIBAL_COUNCIL_TIMELOCK) - balanceBefore, 1e18);

        // TC Timelock can recover funds
        vm.prank(AGEUR_HOLDER);
        ageur.transfer(address(redeemer), 1e18);
        balanceBefore = ageur.balanceOf(MainnetAddresses.TRIBAL_COUNCIL_TIMELOCK);
        vm.prank(MainnetAddresses.TRIBAL_COUNCIL_TIMELOCK);
        redeemer.withdrawERC20(MainnetAddresses.AGEUR);
        assertEq(ageur.balanceOf(MainnetAddresses.TRIBAL_COUNCIL_TIMELOCK) - balanceBefore, 1e18);
    }
}
