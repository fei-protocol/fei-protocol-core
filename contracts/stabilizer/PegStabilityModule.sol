pragma solidity ^0.8.4;

import "./IPegStabilityModule.sol";
import "./../refs/CoreRef.sol";
import "../Constants.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

abstract contract PegStabilityModule is IPegStabilityModule, CoreRef {
    using SafeCast for uint256;

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

    /// @notice event emitted when a new mint fee is set
    event MintFeeChanged(uint256 oldMintFee, uint256 newMintFee);

    /// @notice event emitted when a new redeem fee is set
    event RedeemFeeChanged(uint256 oldRedeemFee, uint256 newRedeemFee);

    /// @notice event emitted when reservesThreshold is updated
    event ReservesThresholdChanged(uint256 oldReservesThreshold, uint256 newReservesThreshold);

    /// @notice event emitted when target is updated
    event TargetChanged(IPCVDeposit oldTarget, IPCVDeposit newTarget);

    constructor(
        address coreAddress,
        uint256 _mintFeeBasisPoints,
        uint256 _redeemFeeBasisPoints,
        uint256 _reservesThreshold,
        IERC20 _token,
        IPCVDeposit _target
    ) CoreRef(coreAddress) {
        require(_mintFeeBasisPoints <= Constants.BASIS_POINTS_GRANULARITY, "PegStabilityModule: Invalid mint fee");
        require(_redeemFeeBasisPoints <= Constants.BASIS_POINTS_GRANULARITY, "PegStabilityModule: Invalid redeem fee");
        require(reservesThreshold > 0, "PegStabilityModule: Invalid reserves threshold");
        require(address(_target) != address(0), "PegStabilityModule: Invalid target");

        mintFeeBasisPoints = _mintFeeBasisPoints;
        redeemFeeBasisPoints = _redeemFeeBasisPoints;
        reservesThreshold = _reservesThreshold;
        token = _token;
        target = _target;
    }

    /// @notice set the mint fee vs oracle price in basis point terms
    function setMintFee(uint256 newMintFeeBasisPoints) external override onlyGovernorOrAdmin {
        require(newMintFeeBasisPoints <= Constants.BASIS_POINTS_GRANULARITY, "PegStabilityModule: Mint fee exceeds bp granularity");
        uint256 _oldMintFee = mintFeeBasisPoints;
        redeemFeeBasisPoints = newMintFeeBasisPoints;

        emit MintFeeChanged(_oldMintFee, newMintFeeBasisPoints);
    }

    /// @notice set the redemption fee vs oracle price in basis point terms
    function setRedeemFee(uint256 newRedeemFeeBasisPoints) external override onlyGovernorOrAdmin {
        require(newRedeemFeeBasisPoints <= Constants.BASIS_POINTS_GRANULARITY, "PegStabilityModule: Redeem fee exceeds bp granularity");
        uint256 _oldRedeemFee = redeemFeeBasisPoints;
        redeemFeeBasisPoints = newRedeemFeeBasisPoints;

        emit RedeemFeeChanged(_oldRedeemFee, newRedeemFeeBasisPoints);
    }

    /// @notice set the ideal amount of reserves for the contract to hold for redemptions
    function setReservesThreshold(uint256 newReservesThreshold) external override onlyGovernorOrAdmin {
        require(newReservesThreshold > 0, "PegStabilityModule: Invalid new reserves threshold");
        uint256 oldReservesThreshold = reservesThreshold;
        reservesThreshold = newReservesThreshold;

        emit ReservesThresholdChanged(oldReservesThreshold, newReservesThreshold);
    }

    /// @notice set the target for sending surplus reserves
    function setTarget(IPCVDeposit newTarget) external override onlyGovernorOrAdmin {
        require(address(newTarget) != address(0), "PegStabilityModule: Invalid new target");
        IPCVDeposit oldTarget = target;

        emit TargetChanged(oldTarget, newTarget);
    }

    /// @notice calculate the amount of FEI out for a given `amountIn` of underlying
    function getMintAmountOut(uint256 amountIn) external override view returns (uint256 amountFeiOut) {
        /// First get oracle price of token
        /// Then figure out how many dollars that amount in is worth by multiplying price * amount.
        /// ensure decimals are normalized if on underlying they are not 18
    }

    /// @notice calculate the amount of underlying out for a given `amountFeiIn` of FEI
    function getRedeemAmountOut(uint256 amountFeiIn) external override view returns (uint256 amountOut) {
        /// First get oracle price of token
        /// Then figure out how many dollars that amount in is worth by multiplying price * amount.
        /// ensure decimals are normalized if on underlying they are not 18
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
}
