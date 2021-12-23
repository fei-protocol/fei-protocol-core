// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../pcv/idle/IIdleToken.sol";
import "./MockERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockIdleToken is IIdleToken, MockERC20 {
    uint256 private constant EXCHANGE_RATE_SCALE = 1e18;

    IERC20 private _token;

    /// @notice exchange rate
    uint256 public tokenPrice = 101 * 1e16; // 1.01 : 1

    constructor(IERC20 token_) {
        _token = token_;
    }

    function setTokenPrice(uint256 price) external {
        tokenPrice = price;
    }

    function mintIdleToken(
        uint256 amount,
        bool,
        address
    ) external override returns (uint256 mintedTokens) {
        require(tokenPrice > 0, "token price is zero");
        _token.transferFrom(msg.sender, address(this), amount);
        mintedTokens = (amount * EXCHANGE_RATE_SCALE) / tokenPrice;
        _mint(msg.sender, mintedTokens);
    }

    function redeemIdleToken(uint256 tokens) external override returns (uint256 redeemAmount) {
        redeemAmount = (tokens * tokenPrice) / EXCHANGE_RATE_SCALE;
        _burn(msg.sender, tokens);
        _token.transfer(msg.sender, redeemAmount);
    }

    function token() external view override returns (address) {
        return address(_token);
    }

    function tokenPriceWithFee(address user) external view override returns (uint256) {
        return tokenPrice;
    }
}
