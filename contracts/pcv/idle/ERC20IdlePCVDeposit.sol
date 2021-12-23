// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../PCVDeposit.sol";
import "../../refs/CoreRef.sol";
import "../../Constants.sol";
import "./IIdleToken.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title ERC-20 implementation for a Idle PCV Deposit
/// @author massun-onibakuchi
contract ERC20IdlePCVDeposit is PCVDeposit {
    /// @notice the token underlying the IdleToken
    IERC20 public token;

    /// @notice the IdleToken
    IIdleToken public idleToken;

    /// @notice Idle ERC20 PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _idleToken IdleToken to deposit
    /// @param _token the token underlying the IdleToken
    constructor(
        address _core,
        IIdleToken _idleToken,
        IERC20 _token
    ) CoreRef(_core) {
        require(_idleToken.token() == address(_token), "IdlePCVDeposit: Not the same token");

        token = _token;
        idleToken = _idleToken;
    }

    /// @notice deposit ERC-20 tokens to Idle
    function deposit() external override whenNotPaused {
        uint256 amount = token.balanceOf(address(this));

        token.approve(address(idleToken), amount);

        idleToken.mintIdleToken(amount, false, address(0));

        emit Deposit(msg.sender, amount);
    }

    /// @notice withdraw tokens from the PCV allocation
    /// @param amountUnderlying of tokens withdrawn
    /// @param to the address to send PCV to
    function withdraw(address to, uint256 amountUnderlying) external override onlyPCVController whenNotPaused {
        require(to != address(0), "IdlePCVDeposit: zero address");
        uint256 priceWithFee = idleToken.tokenPriceWithFee(address(this));

        // Because of rounding, the actual amount of underlying received may differ.
        // So query the actual amount received.
        uint256 balanceBefore = token.balanceOf(address(this));
        idleToken.redeemIdleToken((amountUnderlying * Constants.ETH_GRANULARITY) / priceWithFee);

        amountUnderlying = token.balanceOf(address(this)) - balanceBefore;

        // Fei may withdraw to self
        if (to != address(this)) {
            SafeERC20.safeTransfer(token, to, amountUnderlying);
        }
        emit Withdrawal(msg.sender, to, amountUnderlying);
    }

    // @todo check for manipulation resistance (flashloans, etc)
    /// @notice return total balance of "balanceReportedIn" PCV token in the Deposit
    /// @dev return the balance by using current idleToken price based on net asset value and totalSupply
    function balance() public view override returns (uint256) {
        uint256 priceWithFee = idleToken.tokenPriceWithFee(address(this));
        return (idleToken.balanceOf(address(this)) * priceWithFee) / Constants.ETH_GRANULARITY;
    }

    /// @notice display the related token of the balance reported
    function balanceReportedIn() public view override returns (address) {
        return address(token);
    }

    function resistantBalanceAndFei() public view override returns (uint256, uint256) {
        uint256 _balance = balance();
        if (address(token) == address(fei())) return (_balance, _balance);
        else return (_balance, 0);
    }
}
