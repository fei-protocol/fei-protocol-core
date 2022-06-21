// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./../pcv/PCVDeposit.sol";
import "./../fei/minter/RateLimitedMinter.sol";
import "./IPegStabilityModule.sol";
import "./../refs/OracleRef.sol";
import "../Constants.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract PegStabilityModule is IPegStabilityModule, RateLimitedMinter, OracleRef, PCVDeposit, ReentrancyGuard {
    using Decimal for Decimal.D256;
    using SafeCast for *;
    using SafeERC20 for IERC20;

    /// @notice the fee in basis points for selling asset into FEI
    uint256 public override mintFeeBasisPoints;

    /// @notice the fee in basis points for buying the asset for FEI
    uint256 public override redeemFeeBasisPoints;

    /// @notice the amount of reserves to be held for redemptions
    uint256 public override reservesThreshold;

    /// @notice the PCV deposit target
    IPCVDeposit public override surplusTarget;

    /// @notice the token this PSM will exchange for FEI
    /// This token will be set to WETH9 if the bonding curve accepts eth
    IERC20 public immutable override underlyingToken;

    /// @notice the max mint and redeem fee in basis points
    /// Governance can change this fee
    uint256 public override MAX_FEE = 300;

    /// @notice boolean switch that indicates whether redemptions are paused
    bool public redeemPaused;

    /// @notice event that is emitted when redemptions are paused
    event RedemptionsPaused(address account);

    /// @notice event that is emitted when redemptions are unpaused
    event RedemptionsUnpaused(address account);

    /// @notice boolean switch that indicates whether minting is paused
    bool public mintPaused;

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

    /// @notice constructor
    /// @param params PSM constructor parameter struct
    constructor(
        OracleParams memory params,
        uint256 _mintFeeBasisPoints,
        uint256 _redeemFeeBasisPoints,
        uint256 _reservesThreshold,
        uint256 _feiLimitPerSecond,
        uint256 _mintingBufferCap,
        IERC20 _underlyingToken,
        IPCVDeposit _surplusTarget
    )
        OracleRef(
            params.coreAddress,
            params.oracleAddress,
            params.backupOracle,
            params.decimalsNormalizer,
            params.doInvert
        )
        /// rate limited minter passes false as the last param as there can be no partial mints
        RateLimitedMinter(_feiLimitPerSecond, _mintingBufferCap, false)
    {
        underlyingToken = _underlyingToken;

        _setReservesThreshold(_reservesThreshold);
        _setMintFee(_mintFeeBasisPoints);
        _setRedeemFee(_redeemFeeBasisPoints);
        _setSurplusTarget(_surplusTarget);
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
    function withdraw(address to, uint256 amount) external virtual override onlyPCVController {
        _withdrawERC20(address(underlyingToken), to, amount);
    }

    /// @notice set the mint fee vs oracle price in basis point terms
    function setMintFee(uint256 newMintFeeBasisPoints) external override onlyGovernorOrAdmin {
        _setMintFee(newMintFeeBasisPoints);
    }

    /// @notice set the redemption fee vs oracle price in basis point terms
    function setRedeemFee(uint256 newRedeemFeeBasisPoints) external override onlyGovernorOrAdmin {
        _setRedeemFee(newRedeemFeeBasisPoints);
    }

    /// @notice set the ideal amount of reserves for the contract to hold for redemptions
    function setReservesThreshold(uint256 newReservesThreshold) external override onlyGovernorOrAdmin {
        _setReservesThreshold(newReservesThreshold);
    }

    /// @notice set the target for sending surplus reserves
    function setSurplusTarget(IPCVDeposit newTarget) external override onlyGovernorOrAdmin {
        _setSurplusTarget(newTarget);
    }

    /// @notice set the mint fee vs oracle price in basis point terms
    function _setMintFee(uint256 newMintFeeBasisPoints) internal {
        require(newMintFeeBasisPoints <= MAX_FEE, "PegStabilityModule: Mint fee exceeds max fee");
        uint256 _oldMintFee = mintFeeBasisPoints;
        mintFeeBasisPoints = newMintFeeBasisPoints;

        emit MintFeeUpdate(_oldMintFee, newMintFeeBasisPoints);
    }

    /// @notice internal helper function to set the redemption fee
    function _setRedeemFee(uint256 newRedeemFeeBasisPoints) internal {
        require(newRedeemFeeBasisPoints <= MAX_FEE, "PegStabilityModule: Redeem fee exceeds max fee");
        uint256 _oldRedeemFee = redeemFeeBasisPoints;
        redeemFeeBasisPoints = newRedeemFeeBasisPoints;

        emit RedeemFeeUpdate(_oldRedeemFee, newRedeemFeeBasisPoints);
    }

    /// @notice helper function to set reserves threshold
    function _setReservesThreshold(uint256 newReservesThreshold) internal {
        require(newReservesThreshold > 0, "PegStabilityModule: Invalid new reserves threshold");
        uint256 oldReservesThreshold = reservesThreshold;
        reservesThreshold = newReservesThreshold;

        emit ReservesThresholdUpdate(oldReservesThreshold, newReservesThreshold);
    }

    /// @notice helper function to set the surplus target
    function _setSurplusTarget(IPCVDeposit newSurplusTarget) internal {
        require(address(newSurplusTarget) != address(0), "PegStabilityModule: Invalid new surplus target");
        IPCVDeposit oldTarget = surplusTarget;
        surplusTarget = newSurplusTarget;

        emit SurplusTargetUpdate(oldTarget, newSurplusTarget);
    }

    // ----------- Public State Changing API -----------

    /// @notice send any surplus reserves to the PCV allocation
    function allocateSurplus() external override {
        int256 currentSurplus = reservesSurplus();
        require(currentSurplus > 0, "PegStabilityModule: No surplus to allocate");

        _allocate(currentSurplus.toUint256());
    }

    /// @notice function to receive ERC20 tokens from external contracts
    function deposit() external override {
        int256 currentSurplus = reservesSurplus();
        if (currentSurplus > 0) {
            _allocate(currentSurplus.toUint256());
        }
    }

    /// @notice internal helper method to redeem fei in exchange for an external asset
    function _redeem(
        address to,
        uint256 amountFeiIn,
        uint256 minAmountOut
    ) internal virtual returns (uint256 amountOut) {
        updateOracle();

        amountOut = _getRedeemAmountOut(amountFeiIn);
        require(amountOut >= minAmountOut, "PegStabilityModule: Redeem not enough out");

        IERC20(fei()).safeTransferFrom(msg.sender, address(this), amountFeiIn);

        _transfer(to, amountOut);

        emit Redeem(to, amountFeiIn, amountOut);
    }

    /// @notice internal helper method to mint fei in exchange for an external asset
    function _mint(
        address to,
        uint256 amountIn,
        uint256 minAmountOut
    ) internal virtual returns (uint256 amountFeiOut) {
        updateOracle();

        amountFeiOut = _getMintAmountOut(amountIn);
        require(amountFeiOut >= minAmountOut, "PegStabilityModule: Mint not enough out");

        _transferFrom(msg.sender, address(this), amountIn);

        uint256 amountFeiToTransfer = Math.min(fei().balanceOf(address(this)), amountFeiOut);
        uint256 amountFeiToMint = amountFeiOut - amountFeiToTransfer;

        IERC20(fei()).safeTransfer(to, amountFeiToTransfer);

        if (amountFeiToMint > 0) {
            _mintFei(to, amountFeiToMint);
        }

        emit Mint(to, amountIn, amountFeiOut);
    }

    /// @notice function to redeem FEI for an underlying asset
    /// We do not burn Fei; this allows the contract's balance of Fei to be used before the buffer is used
    /// In practice, this helps prevent artificial cycling of mint-burn cycles and prevents a griefing vector.
    function redeem(
        address to,
        uint256 amountFeiIn,
        uint256 minAmountOut
    ) external virtual override nonReentrant whenNotPaused whileRedemptionsNotPaused returns (uint256 amountOut) {
        amountOut = _redeem(to, amountFeiIn, minAmountOut);
    }

    /// @notice function to buy FEI for an underlying asset
    /// We first transfer any contract-owned fei, then mint the remaining if necessary
    function mint(
        address to,
        uint256 amountIn,
        uint256 minAmountOut
    ) external virtual override nonReentrant whenNotPaused whileMintingNotPaused returns (uint256 amountFeiOut) {
        amountFeiOut = _mint(to, amountIn, minAmountOut);
    }

    // ----------- Public View-Only API ----------

    /// @notice calculate the amount of FEI out for a given `amountIn` of underlying
    /// First get oracle price of token
    /// Then figure out how many dollars that amount in is worth by multiplying price * amount.
    /// ensure decimals are normalized if on underlying they are not 18
    function getMintAmountOut(uint256 amountIn) public view override returns (uint256 amountFeiOut) {
        amountFeiOut = _getMintAmountOut(amountIn);
    }

    /// @notice calculate the amount of underlying out for a given `amountFeiIn` of FEI
    /// First get oracle price of token
    /// Then figure out how many dollars that amount in is worth by multiplying price * amount.
    /// ensure decimals are normalized if on underlying they are not 18
    function getRedeemAmountOut(uint256 amountFeiIn) public view override returns (uint256 amountTokenOut) {
        amountTokenOut = _getRedeemAmountOut(amountFeiIn);
    }

    /// @notice the maximum mint amount out
    function getMaxMintAmountOut() external view override returns (uint256) {
        return fei().balanceOf(address(this)) + buffer();
    }

    /// @notice a flag for whether the current balance is above (true) or below (false) the reservesThreshold
    function hasSurplus() external view override returns (bool) {
        return balance() > reservesThreshold;
    }

    /// @notice an integer representing the positive surplus or negative deficit of contract balance vs reservesThreshold
    function reservesSurplus() public view override returns (int256) {
        return balance().toInt256() - reservesThreshold.toInt256();
    }

    /// @notice function from PCVDeposit that must be overriden
    function balance() public view virtual override returns (uint256) {
        return underlyingToken.balanceOf(address(this));
    }

    /// @notice returns address of token this contracts balance is reported in
    function balanceReportedIn() public view override returns (address) {
        return address(underlyingToken);
    }

    /// @notice override default behavior of not checking fei balance
    function resistantBalanceAndFei() public view override returns (uint256, uint256) {
        return (balance(), feiBalance());
    }

    // ----------- Internal Methods -----------

    /// @notice helper function to get mint amount out based on current market prices
    /// @dev will revert if price is outside of bounds and bounded PSM is being used
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
    /// @dev will revert if price is outside of bounds and bounded PSM is being used
    function _getRedeemAmountOut(uint256 amountFeiIn) internal view virtual returns (uint256 amountTokenOut) {
        Decimal.D256 memory price = readOracle();
        _validatePriceRange(price);

        /// get amount of dollars being provided
        Decimal.D256 memory adjustedAmountIn = Decimal.from(
            (amountFeiIn * (Constants.BASIS_POINTS_GRANULARITY - redeemFeeBasisPoints)) /
                Constants.BASIS_POINTS_GRANULARITY
        );

        /// now turn the dollars into the underlying token amounts
        /// dollars / price = how much token to pay out
        amountTokenOut = adjustedAmountIn.div(price).asUint256();
    }

    /// @notice Allocates a portion of escrowed PCV to a target PCV deposit
    function _allocate(uint256 amount) internal virtual {
        _transfer(address(surplusTarget), amount);

        surplusTarget.deposit();

        emit AllocateSurplus(msg.sender, amount);
    }

    /// @notice transfer ERC20 token
    function _transfer(address to, uint256 amount) internal {
        SafeERC20.safeTransfer(underlyingToken, to, amount);
    }

    /// @notice transfer assets from user to this contract
    function _transferFrom(
        address from,
        address to,
        uint256 amount
    ) internal {
        SafeERC20.safeTransferFrom(underlyingToken, from, to, amount);
    }

    /// @notice mint amount of FEI to the specified user on a rate limit
    function _mintFei(address to, uint256 amount) internal override(CoreRef, RateLimitedMinter) {
        super._mintFei(to, amount);
    }

    // ----------- Hooks -----------

    /// @notice overriden function in the bounded PSM
    function _validatePriceRange(Decimal.D256 memory price) internal view virtual {}
}
