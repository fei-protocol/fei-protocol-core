// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../PCVDeposit.sol";
import "../../refs/CoreRef.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IIdleToken {
    /* ==== ERC20 Methods ==== */
    function balanceOf(address user) external view returns (uint256 amount);

    /* ==== Methods unique to IdleToken ==== */
    function token() external view returns (address underlying);

    function mintIdleToken(
        uint256 _amount,
        bool _skipWholeRebalance,
        address _referral
    ) external returns (uint256 mintedTokens);

    function redeemIdleToken(uint256 _amount) external returns (uint256 redeemedTokens);

    function tokenPriceWithFee(address user) external view returns (uint256 priceWFee);
}

/// @title ERC-20 implementation for a Idle PCV Deposit
/// @author Fei Protocol
contract IdlePCVDeposit is PCVDeposit {
    uint256 private constant EXCHANGE_RATE_SCALE = 1e18;

    /// @notice the token underlying the IdleToken
    IERC20 public token;

    /// @notice the IdleToken
    IIdleToken public idleToken;

    /// @notice refferal address for the IdleToken
    address public referral;

    /// @notice Idle ERC20 PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _idleToken IdleToken to deposit
    /// @param _token the token underlying the IdleToken
    constructor(
        address _core,
        IIdleToken _idleToken,
        IERC20 _token,
        address _referral
    ) CoreRef(_core) {
        require(_idleToken.token() == address(_token), "IdlePCVDeposit: Not a same token");

        token = _token;
        idleToken = _idleToken;
        referral = _referral; // Can be zero address
    }

    /// @notice deposit ERC-20 tokens to Idle
    function deposit() external override whenNotPaused {
        uint256 amount = token.balanceOf(address(this));

        token.approve(address(idleToken), amount);

        idleToken.mintIdleToken(amount, false, referral);

        emit Deposit(msg.sender, amount);
    }

    /// @notice withdraw tokens from the PCV allocation
    /// @param amountUnderlying of tokens withdrawn
    /// @param to the address to send PCV to
    function withdraw(address to, uint256 amountUnderlying) external override onlyPCVController whenNotPaused {
        require(to != address(0), "IdlePCVDeposit: zero address");
        uint256 priceWithFee = idleToken.tokenPriceWithFee(address(this));

        idleToken.redeemIdleToken((amountUnderlying * EXCHANGE_RATE_SCALE) / priceWithFee);

        SafeERC20.safeTransfer(token, to, amountUnderlying);
        emit Withdrawal(msg.sender, to, amountUnderlying);
    }

    /// @notice returns total balance of PCV in the Deposit excluding the FEI
    /// @dev returns stale values from Idle if the market hasn't been updated
    function balance() public view override returns (uint256) {
        uint256 priceWithFee = idleToken.tokenPriceWithFee(address(this));
        return (idleToken.balanceOf(address(this)) * priceWithFee) / EXCHANGE_RATE_SCALE;
    }

    /// @notice display the related token of the balance reported
    function balanceReportedIn() public view override returns (address) {
        return address(token);
    }
}
