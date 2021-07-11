// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../pcv/IPCVDeposit.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockERC20UniswapPCVDeposit is IPCVDeposit {

	IERC20 public token;

	constructor(IERC20 _token) {
		token = _token;
	}

    function deposit() external override {}

    function withdraw(address to, uint256 amount) external override {
        token.transfer(to, amount);
    }

    function withdrawERC20(
      address token, 
      address to, 
      uint256 amount
    ) public override {
        SafeERC20.safeTransfer(IERC20(token), to, amount);
        emit WithdrawERC20(msg.sender, to, token, amount);
    }

    function balance() external view override returns(uint256) {
    	return token.balanceOf(address(this));
    }
}