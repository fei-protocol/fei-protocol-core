// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IAngleStableMaster, IAnglePoolManager} from "./IAngleStableMaster.sol";
import {Decimal} from "../../external/Decimal.sol";
import {IOracle} from "../../oracle/IOracle.sol";
import {CoreRef} from "../../refs/CoreRef.sol";
import {TribeRoles} from "../../core/TribeRoles.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMakerPSM {
    function sellGem(address, uint256) external;
}

/// @title Contract to redeem agEUR for FEI and DAI
/// @author eswak
contract AngleEuroRedeemer is CoreRef {
    using Decimal for Decimal.D256;

    constructor(address _core) CoreRef(_core) {}

    // Angle Protocol addresses
    IAngleStableMaster public constant ANGLE_STABLEMASTER =
        IAngleStableMaster(0x5adDc89785D75C86aB939E9e15bfBBb7Fc086A87);
    IAnglePoolManager public constant ANGLE_POOLMANAGER_USDC =
        IAnglePoolManager(0xe9f183FC656656f1F17af1F2b0dF79b8fF9ad8eD);

    // Maker addresses
    address public constant MAKER_DAI_USDC_PSM_AUTH = 0x0A59649758aa4d66E25f08Dd01271e891fe52199;
    address public constant MAKER_DAI_USDC_PSM = 0x89B78CfA322F6C5dE0aBcEecab66Aee45393cC5A;

    // Token addresses
    IERC20 public constant AGEUR = IERC20(0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8);
    IERC20 public constant USDC = IERC20(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);
    IERC20 public constant DAI = IERC20(0x6B175474E89094C44Da98b954EedeAC495271d0F);

    // Tribe DAO addresses
    IOracle public constant TRIBEDAO_EUR_USD_ORACLE = IOracle(0xFb3a062236A7E08b572F17bc9Ad2bBc2becB87b1);
    address public constant TRIBEDAO_FEI_DAI_PSM = 0x2A188F9EB761F70ECEa083bA6c2A40145078dfc2;
    address public constant TRIBEDAO_TC_TIMELOCK = 0xe0C7DE94395B629860Cbb3c42995F300F56e6d7a;

    /// @notice redeem all agEUR held on this contract to USDC using Angle Protocol,
    /// and then use the Maker PSM to convert the USDC to DAI, and send the DAI to
    /// Tribe DAO's FEI/DAI PSM.
    function redeemAgEurToDai()
        external
        hasAnyOfThreeRoles(TribeRoles.GOVERNOR, TribeRoles.GUARDIAN, TribeRoles.PCV_SAFE_MOVER_ROLE)
    {
        // Get the amount of agEUR to redeem
        uint256 agEurBalance = AGEUR.balanceOf(address(this));

        // agEUR -> USDC
        // Read amount of agEUR to redeem & current oracle price
        (Decimal.D256 memory oracleValue, bool oracleValid) = TRIBEDAO_EUR_USD_ORACLE.read();
        require(oracleValid, "ORACLE_INVALID");
        uint256 usdPerEur = oracleValue.mul(1e18).asUint256(); // ~1.05e18

        // redeem USDC available
        uint256 usdcAvailableForRedeem = ANGLE_POOLMANAGER_USDC.getBalance();
        // scale decimals 6 -> 18
        uint256 agEurSpentToRedeemUsdc = (usdcAvailableForRedeem * 1e12 * 1e18) / (usdPerEur);
        if (agEurSpentToRedeemUsdc > agEurBalance) {
            agEurSpentToRedeemUsdc = agEurBalance;
        }
        // no need to check stableMaster.collateralMap[PoolManager].stocksUsers because
        // USDC has a lot of stock available (~57M)

        // max 1% slippage (angle redeem has 0.5% fee, oracle has 0.15% precision)
        // scale decimals 18 -> 6
        uint256 minUsdcOut = (agEurSpentToRedeemUsdc * usdPerEur * 99) / (100 * 1e18 * 1e12);

        // burn agEUR for USDC
        ANGLE_STABLEMASTER.burn(
            agEurSpentToRedeemUsdc,
            address(this),
            address(this),
            ANGLE_POOLMANAGER_USDC,
            minUsdcOut
        );

        // USDC -> DAI
        // read dai balance before redeeming
        uint256 daiBalanceBefore = DAI.balanceOf(address(this));

        // Use Maker PSM to convert USDC to DAI
        uint256 usdcBalance = USDC.balanceOf(address(this));
        USDC.approve(MAKER_DAI_USDC_PSM_AUTH, usdcBalance);
        IMakerPSM(MAKER_DAI_USDC_PSM).sellGem(address(this), usdcBalance);

        // sanity check
        // Maker PSM has no fee for USDC->DAI
        uint256 daiBalanceAfter = DAI.balanceOf(address(this));
        uint256 redeemedDai = daiBalanceAfter - daiBalanceBefore;
        require(usdcBalance / 1e6 == redeemedDai / 1e18, "PSM_SLIPPAGE");

        // send DAI to DAI/FEI PSM
        DAI.transfer(TRIBEDAO_FEI_DAI_PSM, daiBalanceAfter);
    }

    /// @notice send all tokens held to the Tribal Council timelock
    /// this contract should never hold agEUR as it will atomically be funded & redeemed,
    /// nor should it hold any DAI/FEI/USDC because the redeemed funds are atomically
    /// sent away, but this function is included for funds recovery in case something goes wrong.
    function withdrawERC20(address token)
        external
        hasAnyOfThreeRoles(TribeRoles.GOVERNOR, TribeRoles.GUARDIAN, TribeRoles.PCV_SAFE_MOVER_ROLE)
    {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(TRIBEDAO_TC_TIMELOCK, balance);
    }
}
