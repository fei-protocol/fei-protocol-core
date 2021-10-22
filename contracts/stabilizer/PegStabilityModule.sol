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
import "hardhat/console.sol";

abstract contract PegStabilityModule is IPegStabilityModule, CoreRef, RateLimitedMinter, OracleRef, ReentrancyGuard, PCVDeposit {
    using Decimal for Decimal.D256;
    using SafeCast for uint256;
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
    /// This token will be set to address 0 if the bonding curve accepts eth
    IERC20 public override token;

    /// @notice FEI contract
    IFei public FEI;


    // ----------- Events -----------

    /// @notice event emitted when a new mint fee is set
    event MintFeeChanged(uint256 oldMintFee, uint256 newMintFee);

    /// @notice event emitted when a new redeem fee is set
    event RedeemFeeChanged(uint256 oldRedeemFee, uint256 newRedeemFee);

    /// @notice event emitted when reservesThreshold is updated
    event ReservesThresholdChanged(uint256 oldReservesThreshold, uint256 newReservesThreshold);

    /// @notice event emitted when target is updated
    event TargetChanged(IPCVDeposit oldTarget, IPCVDeposit newTarget);

    /// @notice event emitted upon a redemption
    event Redeem(address to, uint256 amountFeiIn);

    /// @notice event emitted when fei gets minted
    event Mint(address to, uint256 amountIn);

    /// @notice constructor
    /// @param _coreAddress Fei core to reference
    /// @param _oracleAddress Price oracle to reference
    /// @param _mintFeeBasisPoints fee in basis points to buy Fei
    /// @param _redeemFeeBasisPoints fee in basis points to sell Fei
    /// @param _reservesThreshold amount of tokens to hold in this contract
    /// @param _feiLimitPerSecond must be less than or equal to 10,000 fei per second
    /// @param _mintingBufferCap cap of buffer that can be used at once
    /// @param _decimalsNormalizer normalize decimals in oracle if tokens have different decimals
    /// @param _doInvert invert oracle price if true
    /// @param _token token to buy and sell against Fei
    /// @param _FEI Fei token to reference
    constructor(
        address _coreAddress,
        address _oracleAddress,
        uint256 _mintFeeBasisPoints,
        uint256 _redeemFeeBasisPoints,
        uint256 _reservesThreshold,
        uint256 _feiLimitPerSecond,
        uint256 _mintingBufferCap,
        int256 _decimalsNormalizer,
        bool _doInvert,
        IERC20 _token,
        IFei _FEI
    )
        OracleRef(_coreAddress, _oracleAddress, address(0), _decimalsNormalizer, _doInvert)
        /// rate limited minter passes false as the last param as there can be no partial mints
        RateLimitedMinter(_feiLimitPerSecond, _mintingBufferCap, false)
    {
        require(address(_FEI) != address(0), "PegStabilityModule: Invalid FEI contract");

        token = _token;
        FEI = _FEI;
        _setReservesThreshold(_reservesThreshold);
        _setMintFee(_mintFeeBasisPoints);
        _setRedeemFee(_redeemFeeBasisPoints);
        // _setTarget(_target);
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

        emit MintFeeChanged(_oldMintFee, newMintFeeBasisPoints);
    }

    /// @notice internal helper function to set the redemption fee
    function _setRedeemFee(uint256 newRedeemFeeBasisPoints) internal {
        require(newRedeemFeeBasisPoints <= Constants.BASIS_POINTS_GRANULARITY, "PegStabilityModule: Redeem fee exceeds bp granularity");
        uint256 _oldRedeemFee = redeemFeeBasisPoints;
        redeemFeeBasisPoints = newRedeemFeeBasisPoints;

        emit RedeemFeeChanged(_oldRedeemFee, newRedeemFeeBasisPoints);
    }

    /// @notice helper function to set reserves threshold
    function _setReservesThreshold(uint256 newReservesThreshold) internal {
        require(newReservesThreshold > 0, "PegStabilityModule: Invalid new reserves threshold");
        uint256 oldReservesThreshold = reservesThreshold;
        reservesThreshold = newReservesThreshold;

        emit ReservesThresholdChanged(oldReservesThreshold, newReservesThreshold);
    }

    /// @notice helper function to set the target
    function _setTarget(IPCVDeposit newTarget) internal {
        require(address(newTarget) != address(0), "PegStabilityModule: Invalid new target");
        IPCVDeposit oldTarget = target;

        emit TargetChanged(oldTarget, newTarget);
    }

    /// @notice function to redeem FEI for an underlying asset
    function redeem(address to, uint256 amountFeiIn) external virtual override nonReentrant whenNotPaused returns (uint256 amountOut) {
        updateOracle();
        Decimal.D256 memory price;

        (amountOut, price) = _getRedeemAmountOutAndPrice(amountFeiIn);
        require(_validPrice(price), "PegStabilityModule: price out of bounds");
        FEI.transferFrom(msg.sender, address(this), amountFeiIn);
        FEI.burn(amountFeiIn);

        token.safeTransfer(to, amountOut);

        emit Redeem(to, amountFeiIn);
    }

    /// @notice function to buy FEI for an underlying asset
    function mint(address to, uint256 amountIn) external virtual override payable nonReentrant whenNotPaused returns (uint256 amountFeiOut) {
        require(msg.value == 0, "PegStabilityModule: cannot send eth to mint");

        updateOracle();
        Decimal.D256 memory price;

        (amountFeiOut, price) = _getMintAmountOutAndPrice(amountIn);
        require(_validPrice(price), "PegStabilityModule: price out of bounds");

        token.safeTransferFrom(msg.sender, address(this), amountIn);

        _mintFei(msg.sender, amountFeiOut);

        emit Mint(to, amountIn);
    }

    /// @notice function to pause the PSM. Only accessible in the ERC20PSM
    /// should be called whenever the DAI price is above $1.02 or below $0.98 as this will pause the contract
    /// then a guardian or governor will have to unpause the contract
    function oracleErrorPause() external virtual whenNotPaused {
        updateOracle();
        Decimal.D256 memory price = readOracle();

        require(!_validPrice(price), "PegStabilityModule: price not out of bounds");

        _pause();
    }

    /// @notice helper function to determine if price is within a valid range
    /// function is private so that classes that inherit cannot use
    function _validPrice(Decimal.D256 memory price) private pure returns(bool valid) {
        Decimal.D256 memory floorPrice = Decimal.D256({ value: 0.98 ether });
        Decimal.D256 memory ceilingPrice = Decimal.D256({ value: 1.02 ether });

        valid = price.greaterThan(floorPrice) && price.lessThan(ceilingPrice);
        return valid;
    }

    function _getMintAmountOutAndPrice(uint256 amountIn) private view returns (uint256 amountFeiOut, Decimal.D256 memory price) {
        price = readOracle();
        Decimal.D256 memory feiValueOfAmountIn = price.mul(amountIn);

        amountFeiOut = feiValueOfAmountIn
            .mul(Constants.BASIS_POINTS_GRANULARITY - mintFeeBasisPoints)
            .div(Constants.BASIS_POINTS_GRANULARITY)
            .asUint256();
    }

    /// @notice calculate the amount of FEI out for a given `amountIn` of underlying
    /// First get oracle price of token
    /// Then figure out how many dollars that amount in is worth by multiplying price * amount.
    /// ensure decimals are normalized if on underlying they are not 18
    function getMintAmountOut(uint256 amountIn) public override view returns (uint256 amountFeiOut) {
        (amountFeiOut, ) = _getMintAmountOutAndPrice(amountIn);
    }

    function _getRedeemAmountOutAndPrice(uint256 amountFeiIn) private view returns (uint256 amountTokenOut, Decimal.D256 memory price) {
        price = readOracle();

        /// get amount of dollars being provided
        Decimal.D256 memory adjustedAmountIn = Decimal.from(
            amountFeiIn * (Constants.BASIS_POINTS_GRANULARITY - mintFeeBasisPoints) / Constants.BASIS_POINTS_GRANULARITY
        );

        /// now turn the dollars into the underlying token amounts
        /// dollars / price = how much token to pay out
        /// we cannot set doInvert so we must perform this operation manually
        amountTokenOut = adjustedAmountIn.div(price).asUint256();
    }

    /// @notice calculate the amount of underlying out for a given `amountFeiIn` of FEI
    /// First get oracle price of token
    /// Then figure out how many dollars that amount in is worth by multiplying price * amount.
    /// ensure decimals are normalized if on underlying they are not 18
    function getRedeemAmountOut(uint256 amountFeiIn) public override view returns (uint256 amountTokenOut) {
        (amountTokenOut, ) = _getRedeemAmountOutAndPrice(amountFeiIn);
    }

    /// @notice mint amount of FEI to the specified user on a rate limit
    function _mintFei(address to, uint256 amount) internal override(CoreRef, RateLimitedMinter) {
        RateLimitedMinter._mintFei(to, amount);
    }

    /// @notice a flag for whether the current balance is above (true) or below (false) the reservesThreshold
    function meetsReservesThreshold() external override view returns (bool) {
        return tokenBalance() >= reservesThreshold;
    }

    /// @notice an integer representing the positive surplus or negative deficit of contract balance vs reservesThreshold
    function reservesSurplus() public override view returns (int256) {
        return tokenBalance().toInt256() - reservesThreshold.toInt256();
    }

    /// @notice get the balance of underlying tokens this contract holds
    function tokenBalance() public virtual override view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /// @notice function from PCVDeposit that must be overriden
    function balance() public view override virtual returns(uint256) {
        return tokenBalance();
    }

    /// @notice returns address of token this contracts balance is reported in
    function balanceReportedIn() external view override returns (address) {
        return address(token);
    }
}
