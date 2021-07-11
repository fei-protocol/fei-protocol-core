// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../pcv/IPCVDeposit.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockERC20PCVDeposit is IPCVDeposit {

	address payable public beneficiary;
    IERC20 public token;
    uint256 public total;

	constructor(address payable _beneficiary, IERC20 _token) {
		beneficiary = _beneficiary;
        token = _token;
	}

    function deposit() external override {
        total += balance();
        token.transfer(beneficiary, balance());
    }

    function withdraw(address to, uint256 amount) external override {
        total -= amount;
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

    function balance() public view override returns(uint256) {
    	return token.balanceOf(address(this));
    }

    function setBeneficiary(address payable _beneficiary) public {
        beneficiary = _beneficiary;
    }
}