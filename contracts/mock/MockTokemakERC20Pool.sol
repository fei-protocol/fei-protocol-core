// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./MockERC20.sol";

contract MockTokemakERC20Pool is MockERC20 {
    MockERC20 public token;

    mapping(address => uint256) public requestedWithdrawal;

    constructor(address _token) {
        token = MockERC20(_token);
    }

    function underlyer() external view returns (address) {
        return address(token);
    }

    function requestWithdrawal(uint256 amount) external {
        requestedWithdrawal[msg.sender] = amount;
    }

    function deposit(uint256 amount) external {
        mint(msg.sender, amount);
        token.transferFrom(msg.sender, address(this), amount);
    }

    function withdraw(uint256 requestedAmount) external {
        require(
            requestedWithdrawal[msg.sender] >= requestedAmount,
            "WITHDRAW_INSUFFICIENT_BALANCE"
        );
        require(
            token.balanceOf(address(this)) >= requestedAmount,
            "INSUFFICIENT_POOL_BALANCE"
        );
        requestedWithdrawal[msg.sender] -= requestedAmount;
        _burn(msg.sender, requestedAmount);
        token.transfer(msg.sender, requestedAmount);
    }
}
