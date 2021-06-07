// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../pcv/IPCVDeposit.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockEthPCVDeposit is IPCVDeposit {

	address payable beneficiary;
    uint256 total = 0;

	constructor(address payable _beneficiary) {
		beneficiary = _beneficiary;
	}

    receive() external payable {
        total += msg.value;
        if (beneficiary != address(this)) {
    	    Address.sendValue(beneficiary, msg.value);
        }
    }

    function deposit() external override {}

    function withdraw(address to, uint256 amount) external override {
        require(address(this).balance >= amount, "MockEthPCVDeposit: Not enough value held");
        total -= amount;
        Address.sendValue(payable(to), amount);
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
    	return total;
    }

    function setBeneficiary(address payable _beneficiary) public {
        beneficiary = _beneficiary;
    }
}