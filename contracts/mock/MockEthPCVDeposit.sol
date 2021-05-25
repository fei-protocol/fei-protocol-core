// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../pcv/IPCVDeposit.sol";

contract MockEthPCVDeposit is IPCVDeposit {

	address payable beneficiary;
    uint256 total = 0;

	constructor(address payable _beneficiary) public {
		beneficiary = _beneficiary;
	}

    receive() external payable {
        total += msg.value;
        if (beneficiary != address(this)) {
    	    beneficiary.transfer(msg.value);
        }
    }

    function deposit() external override {}

    function withdraw(address to, uint256 amount) external override {
        require(address(this).balance >= amount, "MockEthPCVDeposit: Not enough value held");
        total -= amount;
        payable(to).transfer(amount);
    }

    function balance() external view override returns(uint256) {
    	return total;
    }

    function setBeneficiary(address payable _beneficiary) public {
        beneficiary = _beneficiary;
    }
}