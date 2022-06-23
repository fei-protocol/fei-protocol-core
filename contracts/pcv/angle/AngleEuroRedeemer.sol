// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./IStableMaster.sol";
import "../../external/Decimal.sol";
import "../../oracle/IOracle.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

interface IMakerPSM {
    function sellGem(address, uint256) external;
}

/// @title Contract to redeem agEUR for FEI and DAI
/// @author eswak
contract AngleEuroRedeemer {
    using Decimal for Decimal.D256;

    // Angle Protocol addresses
    IStableMaster public constant ANGLE_STABLEMASTER = IStableMaster(0x5adDc89785D75C86aB939E9e15bfBBb7Fc086A87);
    IPoolManager public constant ANGLE_POOLMANAGER_USDC = IPoolManager(0xe9f183FC656656f1F17af1F2b0dF79b8fF9ad8eD);

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
    function redeem() external {
        // Read amount of agEUR to redeem & current oracle price
        uint256 agEurBalance = AGEUR.balanceOf(address(this));
        (Decimal.D256 memory oracleValue, bool oracleValid) = TRIBEDAO_EUR_USD_ORACLE.read();
        require(oracleValid, "ORACLE_INVALID");
        uint256 usdPerEur = oracleValue.mul(1e18).asUint256(); // ~1.05e18

        // redeem max 90% of USDC available
        uint256 usdcAvailableForRedeem = ANGLE_POOLMANAGER_USDC.getBalance();
        uint256 agEurSpentToRedeemUsdc = (usdcAvailableForRedeem * 1e12 * 1e18 * 9) / (10 * usdPerEur);
        if (agEurSpentToRedeemUsdc > agEurBalance) {
            agEurSpentToRedeemUsdc = agEurBalance;
        }
        // no need to check stableMaster.collateralMap[PoolManager].stocksUsers because
        // USDC has a lot of stock available (>30M)

        // max 1% slippage (angle redeem has 0.5% fee, oracle has 0.15% precision)
        uint256 minUsdcOut = (agEurSpentToRedeemUsdc * usdPerEur * 99) / (100 * 1e18 * 1e12);

        // burn agEUR for USDC
        ANGLE_STABLEMASTER.burn(
            agEurSpentToRedeemUsdc,
            address(this),
            address(this),
            ANGLE_POOLMANAGER_USDC,
            minUsdcOut
        );

        // Use Maker PSM to convert USDC to DAI
        address daiUsdcPSMAuth = 0x0A59649758aa4d66E25f08Dd01271e891fe52199;
        address daiUsdcPSM = 0x89B78CfA322F6C5dE0aBcEecab66Aee45393cC5A;
        uint256 redeemedUsdc = USDC.balanceOf(address(this));
        USDC.approve(daiUsdcPSMAuth, redeemedUsdc);
        IMakerPSM(daiUsdcPSM).sellGem(address(this), redeemedUsdc);

        // sanity check
        uint256 redeemedDai = DAI.balanceOf(address(this));
        require(redeemedUsdc / 1e6 == redeemedDai / 1e18, "PSM_SLIPPAGE");

        // send DAI to DAI/FEI PSM
        DAI.transfer(TRIBEDAO_FEI_DAI_PSM, redeemedDai);
    }

    /// @notice send all agEUR to TC timelock
    /// this contract should never hold agEUR at it will atomically be funded & redeemed
    function withdrawAgEur() external {
        uint256 agEurBalance = AGEUR.balanceOf(address(this));
        AGEUR.transfer(TRIBEDAO_TC_TIMELOCK, agEurBalance);
    }
}
