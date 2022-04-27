// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {Decimal} from "../external/Decimal.sol";
import {Constants} from "../Constants.sol";
import {OracleRef} from "./../refs/OracleRef.sol";
import {TribeRoles} from "./../core/TribeRoles.sol";
import {RateLimited} from "./../utils/RateLimited.sol";
import {IPCVDeposit, PCVDeposit} from "./../pcv/PCVDeposit.sol";
import {INonCustodialPSM} from "./INonCustodialPSM.sol";
import {GlobalRateLimitedMinter} from "./../utils/GlobalRateLimitedMinter.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @notice Peg Stability Module that holds no funds.
/// On a mint, it transfers all proceeds to a PCV Deposit
/// When funds are needed for a redemption, they are simply pulled from the PCV Deposit
contract NonCustodialPSM is OracleRef, RateLimited, ReentrancyGuard, INonCustodialPSM {
    using Decimal for Decimal.D256;
    using SafeCast for *;
    using SafeERC20 for IERC20;

    /// @notice the fee in basis points for selling an asset into Fei
    uint256 public override mintFeeBasisPoints;

    /// @notice the fee in basis points for buying the asset for Fei
    uint256 public override redeemFeeBasisPoints;

    /// @notice the PCV deposit target to deposit and withdraw from
    IPCVDeposit public override pcvDeposit;

    /// @notice the token this PSM will exchange for Fei
    /// Must be a stable token pegged to $1
    IERC20 public immutable override underlyingToken;

    /// @notice Rate Limited Minter contract that will be called when Fei needs to be minted
    GlobalRateLimitedMinter public override rateLimitedMinter;

    /// @notice the max mint and redeem fee in basis points
    /// Governance cannot change the maximum fee
    uint256 public immutable override MAX_FEE = 300;

    /// @notice boolean switch that indicates whether redeeming is paused
    bool public redeemPaused;

    /// @notice boolean switch that indicates whether minting is paused
    bool public mintPaused;

    /// @notice struct for passing constructor parameters related to OracleRef
    struct OracleParams {
        address coreAddress;
        address oracleAddress;
        address backupOracle;
        int256 decimalsNormalizer;
    }

    /// @notice struct for passing constructor parameters related to MultiRateLimited
    struct RateLimitedParams {
        uint256 maxRateLimitPerSecond;
        uint256 rateLimitPerSecond;
        uint256 bufferCap;
    }

    /// @notice struct for passing constructor parameters related to the non custodial PSM
    struct PSMParams {
        uint256 mintFeeBasisPoints;
        uint256 redeemFeeBasisPoints;
        IERC20 underlyingToken;
        IPCVDeposit pcvDeposit;
        GlobalRateLimitedMinter rateLimitedMinter;
    }

    /// @notice construct the non custodial PSM. Structs are used to prevent stack too deep errors
    /// @param params oracle ref constructor data
    /// @param rateLimitedParams rate limited constructor data
    /// @param psmParams non custodial PSM constructor data
    constructor(
        OracleParams memory params,
        RateLimitedParams memory rateLimitedParams,
        PSMParams memory psmParams
    )
        OracleRef(
            params.coreAddress,
            params.oracleAddress,
            params.backupOracle,
            params.decimalsNormalizer,
            false /// leaving as false for now
        )
        /// rate limited replenishable passes false as the last param as there can be no partial actions
        RateLimited(
            rateLimitedParams.maxRateLimitPerSecond,
            rateLimitedParams.rateLimitPerSecond,
            rateLimitedParams.bufferCap,
            false
        )
    {
        underlyingToken = psmParams.underlyingToken;

        _setGlobalRateLimitedMinter(psmParams.rateLimitedMinter);
        _setMintFee(psmParams.mintFeeBasisPoints);
        _setRedeemFee(psmParams.redeemFeeBasisPoints);
        _setPCVDeposit(psmParams.pcvDeposit);
    }

    // ----------- Mint & Redeem pausing modifiers -----------

    /// @notice modifier that allows execution when redemptions are not paused
    modifier whileRedemptionsNotPaused() {
        require(!redeemPaused, "PegStabilityModule: Redeem paused");
        _;
    }

    /// @notice modifier that allows execution when minting is not paused
    modifier whileMintingNotPaused() {
        require(!mintPaused, "PegStabilityModule: Minting paused");
        _;
    }

    // ----------- Governor & Guardian only pausing api -----------

    /// @notice set secondary pausable methods to paused
    function pauseRedeem() external onlyGuardianOrGovernor {
        redeemPaused = true;
        emit RedemptionsPaused(msg.sender);
    }

    /// @notice set secondary pausable methods to unpaused
    function unpauseRedeem() external onlyGuardianOrGovernor {
        redeemPaused = false;
        emit RedemptionsUnpaused(msg.sender);
    }

    /// @notice set secondary pausable methods to paused
    function pauseMint() external onlyGuardianOrGovernor {
        mintPaused = true;
        emit MintingPaused(msg.sender);
    }

    /// @notice set secondary pausable methods to unpaused
    function unpauseMint() external onlyGuardianOrGovernor {
        mintPaused = false;
        emit MintingUnpaused(msg.sender);
    }

    // ----------- Governor, psm admin and parameter admin only state changing api -----------

    /// @notice set the mint fee vs oracle price in basis point terms
    /// @param newMintFeeBasisPoints the new fee in basis points for minting
    function setMintFee(uint256 newMintFeeBasisPoints)
        external
        override
        hasAnyOfTwoRoles(TribeRoles.GOVERNOR, TribeRoles.PARAMETER_ADMIN)
    {
        _setMintFee(newMintFeeBasisPoints);
    }

    /// @notice set the redemption fee vs oracle price in basis point terms
    /// @param newRedeemFeeBasisPoints the new fee in basis points for redemptions
    function setRedeemFee(uint256 newRedeemFeeBasisPoints)
        external
        override
        hasAnyOfTwoRoles(TribeRoles.GOVERNOR, TribeRoles.PARAMETER_ADMIN)
    {
        _setRedeemFee(newRedeemFeeBasisPoints);
    }

    /// @notice set the target for sending all PCV
    /// @param newTarget new PCV Deposit target for this PSM
    function setPCVDeposit(IPCVDeposit newTarget)
        external
        override
        hasAnyOfTwoRoles(TribeRoles.GOVERNOR, TribeRoles.PSM_ADMIN_ROLE)
    {
        _setPCVDeposit(newTarget);
    }

    /// @notice set the target to call for Fei minting
    /// @param newMinter new Global Rate Limited Minter for this PSM
    function setGlobalRateLimitedMinter(GlobalRateLimitedMinter newMinter)
        external
        override
        hasAnyOfTwoRoles(TribeRoles.GOVERNOR, TribeRoles.PSM_ADMIN_ROLE)
    {
        _setGlobalRateLimitedMinter(newMinter);
    }

    // ----------- PCV Controller only state changing api -----------

    /// @notice withdraw ERC20 from the contract
    /// @param token address of the ERC20 to send
    /// @param to address destination of the ERC20
    /// @param amount quantity of ERC20 to send
    function withdrawERC20(
        address token,
        address to,
        uint256 amount
    ) external override onlyPCVController {
        IERC20(token).safeTransfer(to, amount);
        emit WithdrawERC20(msg.sender, token, to, amount);
    }

    // ----------- Public State Changing API -----------

    /// @notice function to redeem Fei for an underlying asset
    /// We do not burn Fei; this allows the contract's balance of Fei to be used before the buffer is used
    /// In practice, this helps prevent artificial cycling of mint-burn cycles and prevents DOS attacks.
    /// This function will deplete the buffer based on the amount of Fei that is being redeemed.
    /// @param to the destination address for proceeds
    /// @param amountFeiIn the amount of Fei to sell
    /// @param minAmountOut the minimum amount out otherwise the TX will fail
    function redeem(
        address to,
        uint256 amountFeiIn,
        uint256 minAmountOut
    ) external virtual override nonReentrant whenNotPaused whileRedemptionsNotPaused returns (uint256 amountOut) {
        _depleteBuffer(amountFeiIn); /// deplete buffer first to save gas on buffer exhaustion sad path

        updateOracle();

        amountOut = _getRedeemAmountOut(amountFeiIn);
        require(amountOut >= minAmountOut, "PegStabilityModule: Redeem not enough out");

        IERC20(fei()).safeTransferFrom(msg.sender, address(this), amountFeiIn);

        pcvDeposit.withdraw(to, amountOut);

        emit Redeem(to, amountFeiIn, amountOut);
    }

    /// @notice function to buy Fei for an underlying asset that is pegged to $1
    /// We first transfer any contract-owned Fei, then mint the remaining if necessary
    /// This function will replenish the buffer based on the amount of Fei that is being sent out.
    /// @param to the destination address for proceeds
    /// @param amountIn the amount of external asset to sell to the PSM
    /// @param minFeiAmountOut the minimum amount of Fei out otherwise the TX will fail
    function mint(
        address to,
        uint256 amountIn,
        uint256 minFeiAmountOut
    ) external virtual override nonReentrant whenNotPaused whileMintingNotPaused returns (uint256 amountFeiOut) {
        updateOracle();

        amountFeiOut = _getMintAmountOut(amountIn);
        require(amountFeiOut >= minFeiAmountOut, "PegStabilityModule: Mint not enough out");

        underlyingToken.safeTransferFrom(msg.sender, address(pcvDeposit), amountIn);
        pcvDeposit.deposit();

        uint256 amountFeiToTransfer = Math.min(fei().balanceOf(address(this)), amountFeiOut);
        uint256 amountFeiToMint = amountFeiOut - amountFeiToTransfer;

        if (amountFeiToTransfer != 0) {
            IERC20(fei()).safeTransfer(to, amountFeiToTransfer);
        }

        if (amountFeiToMint != 0) {
            rateLimitedMinter.mint(to, amountFeiToMint);
        }

        _replenishBuffer(amountFeiOut);

        emit Mint(to, amountIn, amountFeiOut);
    }

    // ----------- Public View-Only API ----------

    /// @notice calculate the amount of Fei out for a given `amountIn` of underlying
    /// First get oracle price of token
    /// Then figure out how many dollars that amount in is worth by multiplying price * amount.
    /// ensure decimals are normalized if on underlying they are not 18
    /// @param amountIn the amount of external asset to sell to the PSM
    /// @return amountFeiOut the amount of Fei received for the amountIn of external asset
    function getMintAmountOut(uint256 amountIn) public view override returns (uint256 amountFeiOut) {
        amountFeiOut = _getMintAmountOut(amountIn);
    }

    /// @notice calculate the amount of underlying out for a given `amountFeiIn` of Fei
    /// First get oracle price of token
    /// Then figure out how many dollars that amount in is worth by multiplying price * amount.
    /// ensure decimals are normalized if on underlying they are not 18
    /// @param amountFeiIn the amount of Fei to redeem
    /// @return amountTokenOut the amount of the external asset received in exchange for the amount of Fei redeemed
    function getRedeemAmountOut(uint256 amountFeiIn) public view override returns (uint256 amountTokenOut) {
        amountTokenOut = _getRedeemAmountOut(amountFeiIn);
    }

    /// @notice getter to return the maximum amount of Fei that could be purchased at once
    /// @return the maximum amount of Fei available for purchase at once through this PSM
    function getMaxMintAmountOut() external view override returns (uint256) {
        return fei().balanceOf(address(this)) + rateLimitedMinter.individualBuffer(address(this));
    }

    // ----------- Internal Methods -----------

    /// @notice helper function to get mint amount out based on current market prices
    /// @dev will revert if price is outside of bounds and price bound PSM is being used
    /// @param amountIn the amount of stable asset in
    /// @return amountFeiOut the amount of Fei received for the amountIn of stable assets
    function _getMintAmountOut(uint256 amountIn) internal view virtual returns (uint256 amountFeiOut) {
        Decimal.D256 memory price = readOracle();
        _validatePriceRange(price);

        Decimal.D256 memory adjustedAmountIn = price.mul(amountIn);

        amountFeiOut = adjustedAmountIn
            .mul(Constants.BASIS_POINTS_GRANULARITY - mintFeeBasisPoints)
            .div(Constants.BASIS_POINTS_GRANULARITY)
            .asUint256();
    }

    /// @notice helper function to get redeem amount out based on current market prices
    /// @dev will revert if price is outside of bounds and price bound PSM is being used
    /// @param amountFeiIn the amount of Fei to redeem
    /// @return amountTokenOut the amount of the external asset received in exchange for the amount of Fei redeemed
    function _getRedeemAmountOut(uint256 amountFeiIn) internal view virtual returns (uint256 amountTokenOut) {
        Decimal.D256 memory price = readOracle();
        _validatePriceRange(price);

        /// get amount of Fei being provided being redeemed after fees
        Decimal.D256 memory adjustedAmountIn = Decimal.from(
            (amountFeiIn * (Constants.BASIS_POINTS_GRANULARITY - redeemFeeBasisPoints)) /
                Constants.BASIS_POINTS_GRANULARITY
        );

        /// now turn the Fei into the underlying token amounts
        /// amount Fei in / Fei you receive for $1 = how much stable token to pay out
        amountTokenOut = adjustedAmountIn.div(price).asUint256();
    }

    // ----------- Helper methods to change state -----------

    /// @notice set the global rate limited minter this PSM calls to mint Fei
    /// @param newMinter the new minter contract that this PSM will reference
    function _setGlobalRateLimitedMinter(GlobalRateLimitedMinter newMinter) internal {
        require(address(newMinter) != address(0), "PegStabilityModule: Invalid new GlobalRateLimitedMinter");
        GlobalRateLimitedMinter oldMinter = rateLimitedMinter;
        rateLimitedMinter = newMinter;

        emit GlobalRateLimitedMinterUpdate(oldMinter, newMinter);
    }

    /// @notice set the mint fee vs oracle price in basis point terms
    /// @param newMintFeeBasisPoints the new fee for minting in basis points
    function _setMintFee(uint256 newMintFeeBasisPoints) internal {
        require(newMintFeeBasisPoints <= MAX_FEE, "PegStabilityModule: Mint fee exceeds max fee");
        uint256 _oldMintFee = mintFeeBasisPoints;
        mintFeeBasisPoints = newMintFeeBasisPoints;

        emit MintFeeUpdate(_oldMintFee, newMintFeeBasisPoints);
    }

    /// @notice internal helper function to set the redemption fee
    /// @param newRedeemFeeBasisPoints the new fee for redemptions in basis points
    function _setRedeemFee(uint256 newRedeemFeeBasisPoints) internal {
        require(newRedeemFeeBasisPoints <= MAX_FEE, "PegStabilityModule: Redeem fee exceeds max fee");
        uint256 _oldRedeemFee = redeemFeeBasisPoints;
        redeemFeeBasisPoints = newRedeemFeeBasisPoints;

        emit RedeemFeeUpdate(_oldRedeemFee, newRedeemFeeBasisPoints);
    }

    /// @notice helper function to set the PCV deposit
    /// @param newPCVDeposit the new PCV deposit that this PSM will pull assets from and deposit assets into
    function _setPCVDeposit(IPCVDeposit newPCVDeposit) internal {
        require(address(newPCVDeposit) != address(0), "PegStabilityModule: Invalid new PCVDeposit");
        /* Removed to be compatible with PCV deposit v1. (which uses token() instead of balanceReportedIn())
        require(
            newPCVDeposit.balanceReportedIn() == address(underlyingToken),
            "PegStabilityModule: Underlying token mismatch"
        );
        */
        IPCVDeposit oldTarget = pcvDeposit;
        pcvDeposit = newPCVDeposit;

        emit PCVDepositUpdate(oldTarget, newPCVDeposit);
    }

    // ----------- Hooks -----------

    /// @notice overriden function in the price bound PSM
    function _validatePriceRange(Decimal.D256 memory price) internal view virtual {}
}
