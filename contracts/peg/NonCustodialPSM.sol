// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {Decimal} from "../external/Decimal.sol";
import {Constants} from "../Constants.sol";
import {OracleRef} from "./../refs/OracleRef.sol";
import {RateLimited} from "./../utils/RateLimited.sol";
import {INonCustodialPSM} from "./INonCustodialPSM.sol";
import {IPCVDeposit, PCVDeposit} from "./../pcv/PCVDeposit.sol";
import {GlobalRateLimitedMinter} from "./../utils/GlobalRateLimitedMinter.sol";

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @notice Peg Stability Module that holds no funds.
/// On a mint, it transfers all proceeds to a PCV Deposit and then deposits them into the deposit's target
/// When funds are needed for a redemption, they are simply pulled from the PCV Deposit
contract NonCustodialPSM is
    INonCustodialPSM,
    RateLimited,
    OracleRef,
    PCVDeposit,
    ReentrancyGuard
{
    using Decimal for Decimal.D256;
    using SafeCast for *;
    using SafeERC20 for IERC20;

    /// @notice the fee in basis points for selling asset into FEI
    uint256 public override mintFeeBasisPoints;

    /// @notice the fee in basis points for buying the asset for FEI
    uint256 public override redeemFeeBasisPoints;

    /// @notice the PCV deposit target to deposit and withdraw from
    IPCVDeposit public override pcvDeposit;

    /// @notice the token this PSM will exchange for FEI
    /// This token will be set to WETH9 if the bonding curve accepts eth
    IERC20 public immutable override underlyingToken;

    /// @notice Rate Limited Minter contract that will be called when FEI needs to be minted
    GlobalRateLimitedMinter public immutable rateLimitedMinter;

    /// @notice the max mint and redeem fee in basis points
    /// Governance can change this fee
    uint256 public override MAX_FEE = 300;

    /// @notice boolean switch that indicates whether redemptions are paused
    bool public redeemPaused;

    /// @notice boolean switch that indicates whether minting is paused
    bool public mintPaused;

    /// @notice event that is emitted when redemptions are paused
    event RedemptionsPaused(address account);

    /// @notice event that is emitted when redemptions are unpaused
    event RedemptionsUnpaused(address account);

    /// @notice event that is emitted when minting is paused
    event MintingPaused(address account);

    /// @notice event that is emitted when minting is unpaused
    event MintingUnpaused(address account);

    /// @notice struct for passing constructor parameters related to OracleRef
    struct OracleParams {
        address coreAddress;
        address oracleAddress;
        address backupOracle;
        int256 decimalsNormalizer;
        bool doInvert;
    }

    /// @notice struct for passing constructor parameters related to MultiRateLimited
    struct RateLimitedParams {
        uint256 maxRateLimitPerSecond;
        uint256 rateLimitPerSecond;
        uint256 bufferCap;
    }

    struct PSMParams {
        uint256 mintFeeBasisPoints;
        uint256 redeemFeeBasisPoints;
        uint256 feiLimitPerSecond;
        uint256 mintingBufferCap;
        IERC20 underlyingToken;
        IPCVDeposit pcvDeposit;
        GlobalRateLimitedMinter rateLimitedMinter;
        uint112 feiRateLimitPerSecond;
        uint144 feiBufferCap;
        uint112 underlyingTokenRateLimitPerSecond;
        uint144 underlyingTokenBufferCap;
    }

    /// @notice constructor
    /// @param params PSM constructor parameter struct
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
            params.doInvert
        )
        /// rate limited minter passes false as the last param as there can be no partial mints
        RateLimited(
            rateLimitedParams.maxRateLimitPerSecond,
            rateLimitedParams.rateLimitPerSecond,
            rateLimitedParams.bufferCap,
            false
        )
    {
        underlyingToken = psmParams.underlyingToken;
        rateLimitedMinter = psmParams.rateLimitedMinter;

        _setMintFee(psmParams.mintFeeBasisPoints);
        _setRedeemFee(psmParams.redeemFeeBasisPoints);
        _setPCVDeposit(psmParams.pcvDeposit);
        _setContractAdminRole(keccak256("PSM_ADMIN_ROLE"));
    }

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

    /// @notice set secondary pausable methods to paused
    function pauseRedeem() external isGovernorOrGuardianOrAdmin {
        redeemPaused = true;
        emit RedemptionsPaused(msg.sender);
    }

    /// @notice set secondary pausable methods to unpaused
    function unpauseRedeem() external isGovernorOrGuardianOrAdmin {
        redeemPaused = false;
        emit RedemptionsUnpaused(msg.sender);
    }

    /// @notice set secondary pausable methods to paused
    function pauseMint() external isGovernorOrGuardianOrAdmin {
        mintPaused = true;
        emit MintingPaused(msg.sender);
    }

    /// @notice set secondary pausable methods to unpaused
    function unpauseMint() external isGovernorOrGuardianOrAdmin {
        mintPaused = false;
        emit MintingUnpaused(msg.sender);
    }

    /// @notice withdraw assets from PSM to an external address
    function withdraw(address to, uint256 amount)
        external
        virtual
        override
        onlyPCVController
    {
        _withdrawERC20(address(underlyingToken), to, amount);
    }

    /// @notice set the mint fee vs oracle price in basis point terms
    function setMintFee(uint256 newMintFeeBasisPoints)
        external
        override
        onlyGovernorOrAdmin
    {
        _setMintFee(newMintFeeBasisPoints);
    }

    /// @notice set the redemption fee vs oracle price in basis point terms
    function setRedeemFee(uint256 newRedeemFeeBasisPoints)
        external
        override
        onlyGovernorOrAdmin
    {
        _setRedeemFee(newRedeemFeeBasisPoints);
    }

    /// @notice set the target for sending all PCV
    function setPCVDeposit(IPCVDeposit newTarget)
        external
        override
        onlyGovernorOrAdmin
    {
        _setPCVDeposit(newTarget);
    }

    /// @notice set the mint fee vs oracle price in basis point terms
    function _setMintFee(uint256 newMintFeeBasisPoints) internal {
        require(
            newMintFeeBasisPoints <= MAX_FEE,
            "PegStabilityModule: Mint fee exceeds max fee"
        );
        uint256 _oldMintFee = mintFeeBasisPoints;
        mintFeeBasisPoints = newMintFeeBasisPoints;

        emit MintFeeUpdate(_oldMintFee, newMintFeeBasisPoints);
    }

    /// @notice internal helper function to set the redemption fee
    function _setRedeemFee(uint256 newRedeemFeeBasisPoints) internal {
        require(
            newRedeemFeeBasisPoints <= MAX_FEE,
            "PegStabilityModule: Redeem fee exceeds max fee"
        );
        uint256 _oldRedeemFee = redeemFeeBasisPoints;
        redeemFeeBasisPoints = newRedeemFeeBasisPoints;

        emit RedeemFeeUpdate(_oldRedeemFee, newRedeemFeeBasisPoints);
    }

    /// @notice helper function to set the surplus target
    function _setPCVDeposit(IPCVDeposit newSurplusTarget) internal {
        require(
            address(newSurplusTarget) != address(0),
            "PegStabilityModule: Invalid new surplus target"
        );
        IPCVDeposit oldTarget = pcvDeposit;
        pcvDeposit = newSurplusTarget;

        emit PCVDepositUpdate(oldTarget, newSurplusTarget);
    }

    // ----------- Public State Changing API -----------

    /// @notice function to redeem FEI for an underlying asset
    /// We do not burn Fei; this allows the contract's balance of Fei to be used before the buffer is used
    /// In practice, this helps prevent artificial cycling of mint-burn cycles and prevents a griefing vector.
    /// This function will deplete the buffer for pulling from the PCV Deposit
    function redeem(
        address to,
        uint256 amountFeiIn,
        uint256 minAmountOut
    )
        external
        virtual
        override
        nonReentrant
        whenNotPaused
        whileRedemptionsNotPaused
        returns (uint256 amountOut)
    {
        updateOracle();

        amountOut = _getRedeemAmountOut(amountFeiIn);
        require(
            amountOut >= minAmountOut,
            "PegStabilityModule: Redeem not enough out"
        );
        _depleteBuffer(amountOut);

        IERC20(fei()).safeTransferFrom(msg.sender, address(this), amountFeiIn);

        _transfer(to, amountOut);

        emit Redeem(to, amountFeiIn, amountOut);
    }

    /// @notice function to buy FEI for an underlying asset
    /// We first transfer any contract-owned fei, then mint the remaining if necessary
    function mint(
        address to,
        uint256 amountIn,
        uint256 minAmountOut
    )
        external
        virtual
        override
        nonReentrant
        whenNotPaused
        whileMintingNotPaused
        returns (uint256 amountFeiOut)
    {
        updateOracle();

        amountFeiOut = _getMintAmountOut(amountIn);
        require(
            amountFeiOut >= minAmountOut,
            "PegStabilityModule: Mint not enough out"
        );

        _transferFrom(msg.sender, address(this), amountIn);

        uint256 amountFeiToTransfer = Math.min(
            fei().balanceOf(address(this)),
            amountFeiOut
        );
        uint256 amountFeiToMint = amountFeiOut - amountFeiToTransfer;

        IERC20(fei()).safeTransfer(to, amountFeiToTransfer);

        if (amountFeiToMint > 0) {
            rateLimitedMinter.mintFei(to, amountFeiToMint);
        }

        emit Mint(to, amountIn, amountFeiOut);
    }

    // ----------- Public View-Only API ----------

    /// @notice calculate the amount of FEI out for a given `amountIn` of underlying
    /// First get oracle price of token
    /// Then figure out how many dollars that amount in is worth by multiplying price * amount.
    /// ensure decimals are normalized if on underlying they are not 18
    function getMintAmountOut(uint256 amountIn)
        public
        view
        override
        returns (uint256 amountFeiOut)
    {
        amountFeiOut = _getMintAmountOut(amountIn);
    }

    /// @notice calculate the amount of underlying out for a given `amountFeiIn` of FEI
    /// First get oracle price of token
    /// Then figure out how many dollars that amount in is worth by multiplying price * amount.
    /// ensure decimals are normalized if on underlying they are not 18
    function getRedeemAmountOut(uint256 amountFeiIn)
        public
        view
        override
        returns (uint256 amountTokenOut)
    {
        amountTokenOut = _getRedeemAmountOut(amountFeiIn);
    }

    /// @notice the maximum mint amount out
    function getMaxMintAmountOut() external view override returns (uint256) {
        return fei().balanceOf(address(this)) + buffer();
    }

    /// @notice function from PCVDeposit that must be overriden
    function balance() public view virtual override returns (uint256) {
        return underlyingToken.balanceOf(address(this));
    }

    /// @notice returns address of token this contracts balance is reported in
    function balanceReportedIn() external view override returns (address) {
        return address(underlyingToken);
    }

    /// @notice override default behavior of not checking fei balance
    function resistantBalanceAndFei()
        public
        view
        override
        returns (uint256, uint256)
    {
        return (balance(), feiBalance());
    }

    // ----------- Internal Methods -----------

    /// @notice helper function to get mint amount out based on current market prices
    /// @dev will revert if price is outside of bounds and bounded PSM is being used
    function _getMintAmountOut(uint256 amountIn)
        internal
        view
        virtual
        returns (uint256 amountFeiOut)
    {
        Decimal.D256 memory price = readOracle();
        _validatePriceRange(price);

        Decimal.D256 memory adjustedAmountIn = price.mul(amountIn);

        amountFeiOut = adjustedAmountIn
            .mul(Constants.BASIS_POINTS_GRANULARITY - mintFeeBasisPoints)
            .div(Constants.BASIS_POINTS_GRANULARITY)
            .asUint256();
    }

    /// @notice helper function to get redeem amount out based on current market prices
    /// @dev will revert if price is outside of bounds and bounded PSM is being used
    function _getRedeemAmountOut(uint256 amountFeiIn)
        internal
        view
        virtual
        returns (uint256 amountTokenOut)
    {
        Decimal.D256 memory price = readOracle();
        _validatePriceRange(price);

        /// get amount of dollars being provided
        Decimal.D256 memory adjustedAmountIn = Decimal.from(
            (amountFeiIn *
                (Constants.BASIS_POINTS_GRANULARITY - redeemFeeBasisPoints)) /
                Constants.BASIS_POINTS_GRANULARITY
        );

        /// now turn the dollars into the underlying token amounts
        /// dollars / price = how much token to pay out
        amountTokenOut = adjustedAmountIn.div(price).asUint256();
    }

    /// @notice transfer ERC20 token to the recipient from the PCV Deposit
    /// @param to recipient address
    /// @param amount number of tokens sent to recipient
    function _transfer(address to, uint256 amount) internal {
        pcvDeposit.withdraw(to, amount);
    }

    /// @notice transfer assets from user to this contract
    /// @param from sending address
    /// @param amount number of tokens sent to PCV Deposit
    function _transferFrom(
        address from,
        address,
        uint256 amount
    ) internal {
        underlyingToken.safeTransferFrom(from, address(pcvDeposit), amount);
        pcvDeposit.deposit();
    }

    /// @notice function to move non FEI ERC20 tokens to the PCV Deposit
    function sweep() external override {
        uint256 currentBalance = balance();
        require(currentBalance != 0, "PegStabilityModule: No balance to sweep");

        underlyingToken.safeTransfer(address(pcvDeposit), currentBalance);
        pcvDeposit.deposit();
    }

    /// @notice function to move non FEI ERC20 tokens to the PCV Deposit
    function deposit() external override {
        uint256 currentBalance = balance();
        require(
            currentBalance != 0,
            "PegStabilityModule: No balance to deposit"
        );

        underlyingToken.safeTransfer(address(pcvDeposit), currentBalance);
        pcvDeposit.deposit();
    }

    // ----------- Hooks -----------

    /// @notice overriden function in the bounded PSM
    function _validatePriceRange(Decimal.D256 memory price)
        internal
        view
        virtual
    {}
}
