// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../pcv/IPCVDeposit.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockERC20UniswapPCVDeposit is IPCVDeposit {

	IERC20 public token;

	constructor(IERC20 _token) {
		token = _token;
	}

    function deposit() external override {}

    function withdraw(address to, uint256 amount) external override {
        token.transfer(to, amount);
    }

    function balance() external view override returns(uint256) {
    	return token.balanceOf(address(this));
    }
}