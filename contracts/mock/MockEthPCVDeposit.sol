pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../pcv/IPCVDeposit.sol";

contract MockEthPCVDeposit is IPCVDeposit {

	address payable beneficiary;
    uint256 total = 0;

	constructor(address payable _beneficiary) public {
		beneficiary = _beneficiary;
	}

    function deposit(uint256 amount) external override payable {
    	require(amount == msg.value, "MockEthPCVDeposit: Sent value does not equal input");
    	beneficiary.transfer(amount);
        total += amount;
    }

    function withdraw(address to, uint256 amount) external override {
        require(address(this).balance >= amount, "MockEthPCVDeposit: Not enough value held");
        total -= amount;
        payable(to).transfer(amount);
    }

    function totalValue() external view override returns(uint256) {
    	return total;
    }

}