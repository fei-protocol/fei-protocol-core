pragma solidity ^0.8.4;

import "./../token/Fei.sol";
import "./../pcv/PCVDeposit.sol";
import "./../utils/RateLimitedMinter.sol";
import "./IPegStabilityModule.sol";
import "./../refs/CoreRef.sol";
import "./../refs/OracleRef.sol";
import "../Constants.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

abstract contract PegStabilityModule is IPegStabilityModule, CoreRef, RateLimitedMinter, OracleRef, ReentrancyGuard, PCVDeposit {
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
    IPCVDeposit public override target;

    /// @notice the token this PSM will exchange for FEI
    /// This token will be set to WETH9 if the bonding curve accepts eth
    IERC20 public immutable override token;

    /// @notice constructor
    /// @param _coreAddress Fei core to reference
    /// @param _oracleAddress Price oracle to reference
    /// @param _backupOracle Price oracle to reference
    /// @param _mintFeeBasisPoints fee in basis points to buy Fei
    /// @param _redeemFeeBasisPoints fee in basis points to sell Fei
    /// @param _reservesThreshold amount of tokens to hold in this contract
    /// @param _feiLimitPerSecond must be less than or equal to 10,000 fei per second
    /// @param _mintingBufferCap cap of buffer that can be used at once
    /// @param _decimalsNormalizer normalize decimals in oracle if tokens have different decimals
    /// @param _doInvert invert oracle price if true
    /// @param _token token to buy and sell against Fei
    /// @param _target Fei token to reference
    constructor(
        address _coreAddress,
        address _oracleAddress,
        address _backupOracle,
        uint256 _mintFeeBasisPoints,
        uint256 _redeemFeeBasisPoints,
        uint256 _reservesThreshold,
        uint256 _feiLimitPerSecond,
        uint256 _mintingBufferCap,
        int256 _decimalsNormalizer,
        bool _doInvert,
        IERC20 _token,
        IPCVDeposit _target
    )
        OracleRef(_coreAddress, _oracleAddress, _backupOracle, _decimalsNormalizer, _doInvert)
        /// rate limited minter passes false as the last param as there can be no partial mints
        RateLimitedMinter(_feiLimitPerSecond, _mintingBufferCap, false)
    {
        token = _token;

        _setReservesThreshold(_reservesThreshold);
        _setMintFee(_mintFeeBasisPoints);
        _setRedeemFee(_redeemFeeBasisPoints);
        _setTarget(_target);
    }

    /// @notice withdraw assets from PSM to an external address
    function withdraw(address to, uint256 amount) external override virtual onlyPCVController {
        _withdrawERC20(address(token), to, amount);
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
    function setTarget(IPCVDeposit newTarget) external override onlyGovernorOrAdmin {
        _setTarget(newTarget);
    }

    /// @notice set the mint fee vs oracle price in basis point terms
    function _setMintFee(uint256 newMintFeeBasisPoints) internal {
        require(newMintFeeBasisPoints <= Constants.BASIS_POINTS_GRANULARITY, "PegStabilityModule: Mint fee exceeds bp granularity");
        uint256 _oldMintFee = mintFeeBasisPoints;
        mintFeeBasisPoints = newMintFeeBasisPoints;

        emit MintFeeUpdate(_oldMintFee, newMintFeeBasisPoints);
    }

    /// @notice internal helper function to set the redemption fee
    function _setRedeemFee(uint256 newRedeemFeeBasisPoints) internal {
        require(newRedeemFeeBasisPoints <= Constants.BASIS_POINTS_GRANULARITY, "PegStabilityModule: Redeem fee exceeds bp granularity");
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

    /// @notice helper function to set the target
    function _setTarget(IPCVDeposit newTarget) internal {
        require(address(newTarget) != address(0), "PegStabilityModule: Invalid new target");
        IPCVDeposit oldTarget = target;
        target = newTarget;

        emit TargetUpdate(oldTarget, newTarget);
    }

    /// @notice Allocates a portion of escrowed PCV to a target PCV deposit
    function _allocate(uint256 amount) internal {
        _transfer(address(target), amount);
        target.deposit();
    }

    function allocateSurplus() external override {
        int256 currentSurplus = reservesSurplus();
        require(currentSurplus > 0, "PegStabilityModule: No surplus to allocate");

        _allocate(currentSurplus.toUint256());
    }

    /// @notice function to receive ERC20 tokens from external contracts
    function deposit() external override {
        int256 currentSurplus = reservesSurplus();
        if (currentSurplus > 0 ) {
            _allocate(currentSurplus.toUint256());
        }
    }

    /// @notice function to redeem FEI for an underlying asset
    function redeem(address to, uint256 amountFeiIn) external virtual override nonReentrant whenNotPaused returns (uint256 amountOut) {
        updateOracle();

        amountOut = _getRedeemAmountOutAndPrice(amountFeiIn);

        fei().transferFrom(msg.sender, address(this), amountFeiIn);
        _burnFeiHeld();

        _transfer(to, amountOut);

        emit Redeem(to, amountFeiIn);
    }

    /// @notice function to buy FEI for an underlying asset
    function mint(address to, uint256 amountIn) external virtual override nonReentrant whenNotPaused returns (uint256 amountFeiOut) {
        updateOracle();

        _transferFrom(msg.sender, address(this), amountIn);

        amountFeiOut = _getMintAmountOutAndPrice(amountIn);

        _mintFei(to, amountFeiOut);

        emit Mint(to, amountIn);
    }

    function _transfer(address to, uint256 amount) internal {
        SafeERC20.safeTransfer(token, to, amount);
    }

    function _transferFrom(address from, address to, uint256 amount) internal {
        SafeERC20.safeTransferFrom(token, from, to, amount);
    }

    /// @notice overriden function in the bounded PSM
    function _validatePriceRange(Decimal.D256 memory price) internal view virtual {}

    function _getMintAmountOutAndPrice(uint256 amountIn) private view returns (uint256 amountFeiOut) {
        Decimal.D256 memory price = readOracle();
        _validatePriceRange(price);

        Decimal.D256 memory adjustedAmountIn = price.mul(amountIn);

        amountFeiOut = adjustedAmountIn
            .mul(Constants.BASIS_POINTS_GRANULARITY - mintFeeBasisPoints)
            .div(Constants.BASIS_POINTS_GRANULARITY)
            .asUint256();
    }

    /// @notice calculate the amount of FEI out for a given `amountIn` of underlying
    /// First get oracle price of token
    /// Then figure out how many dollars that amount in is worth by multiplying price * amount.
    /// ensure decimals are normalized if on underlying they are not 18
    function getMintAmountOut(uint256 amountIn) public override view returns (uint256 amountFeiOut) {
        amountFeiOut = _getMintAmountOutAndPrice(amountIn);
    }

    function _getRedeemAmountOutAndPrice(uint256 amountFeiIn) private view returns (uint256 amountTokenOut) {
        Decimal.D256 memory price = readOracle();
        _validatePriceRange(price);

        /// get amount of dollars being provided
        Decimal.D256 memory adjustedAmountIn = Decimal.from(
            amountFeiIn * (Constants.BASIS_POINTS_GRANULARITY - mintFeeBasisPoints) / Constants.BASIS_POINTS_GRANULARITY
        );

        /// now turn the dollars into the underlying token amounts
        /// dollars / price = how much token to pay out
        amountTokenOut = adjustedAmountIn.div(price).asUint256();
    }

    /// @notice calculate the amount of underlying out for a given `amountFeiIn` of FEI
    /// First get oracle price of token
    /// Then figure out how many dollars that amount in is worth by multiplying price * amount.
    /// ensure decimals are normalized if on underlying they are not 18
    function getRedeemAmountOut(uint256 amountFeiIn) public override view returns (uint256 amountTokenOut) {
        amountTokenOut = _getRedeemAmountOutAndPrice(amountFeiIn);
    }

    /// @notice mint amount of FEI to the specified user on a rate limit
    function _mintFei(address to, uint256 amount) internal override(CoreRef, RateLimitedMinter) {
        super._mintFei(to, amount);
    }

    /// @notice a flag for whether the current balance is above (true) or below (false) the reservesThreshold
    function hasSurplus() external override view returns (bool) {
        return balance() > reservesThreshold;
    }

    /// @notice an integer representing the positive surplus or negative deficit of contract balance vs reservesThreshold
    function reservesSurplus() public override view returns (int256) {
        return balance().toInt256() - reservesThreshold.toInt256();
    }

    /// @notice function from PCVDeposit that must be overriden
    function balance() public view override virtual returns(uint256) {
        return token.balanceOf(address(this));
    }

    /// @notice returns address of token this contracts balance is reported in
    function balanceReportedIn() external view override returns (address) {
        return address(token);
    }
}
