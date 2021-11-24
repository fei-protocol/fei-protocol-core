// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./MockERC20.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface CToken {
    function redeemUnderlying(uint redeemAmount) external returns (uint);
    function exchangeRateStored() external view returns (uint);
    function balanceOf(address account) external view returns (uint);
}

contract MockCToken is MockERC20 {

    IERC20 public token;
    bool public error;
    bool public isCEther;

    uint256 private constant EXCHANGE_RATE_SCALE = 1e18;
    uint256 public effectiveExchangeRate = 2;

    constructor(IERC20 _token, bool _isCEther) {
        token = _token;
        isCEther = _isCEther;
    }

    function setError(bool _error) external {
        error = _error;
    }

    function isCToken() external pure returns(bool) {
        return true;
    }

    function underlying() external view returns(address) {
        return address(token);
    }

    function mint() external payable {
        _mint(msg.sender, msg.value / effectiveExchangeRate);
    }

    function mint(uint256 amount) external returns (uint) {
        token.transferFrom(msg.sender, address(this), amount);
        _mint(msg.sender, amount / effectiveExchangeRate);
        return error ? 1 : 0;
    }

    function redeemUnderlying(uint redeemAmount) external returns (uint) {
        _burn(msg.sender, redeemAmount / effectiveExchangeRate);
        if (address(this).balance >= redeemAmount) {
            payable(msg.sender).transfer(redeemAmount);
        } else {
            token.transfer(msg.sender, redeemAmount);
        }
        return error ? 1 : 0;
    }

    function exchangeRateStored() external view returns (uint) {
        return EXCHANGE_RATE_SCALE * effectiveExchangeRate; // 2:1
    }
}
