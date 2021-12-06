// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./MockERC20.sol";
import "./MockWeth.sol";

contract MockTokemakEthPool is MockERC20 {
    MockWeth public weth;

    mapping(address => uint256) public requestedWithdrawal;

    constructor(address _weth) {
        weth = MockWeth(_weth);
    }

    receive() external payable {}

    function underlyer() external view returns (address) {
        return address(weth);
    }

    function requestWithdrawal(uint256 amount) external {
        requestedWithdrawal[msg.sender] = amount;
    }

    function deposit(uint256 amount) external payable {
        mint(msg.sender, amount);
        weth.deposit{value:msg.value}();
    }

    function withdraw(uint256 requestedAmount, bool asEth) external {
        require(requestedWithdrawal[msg.sender] >= requestedAmount, "WITHDRAW_INSUFFICIENT_BALANCE");
        require(weth.balanceOf(address(this)) >= requestedAmount, "INSUFFICIENT_POOL_BALANCE");
        requestedWithdrawal[msg.sender] -= requestedAmount;
        _burn(msg.sender, requestedAmount);
        weth.withdraw(requestedAmount);
        payable(msg.sender).transfer(requestedAmount);
    }
}
