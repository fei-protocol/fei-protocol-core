pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../allocation/IAllocation.sol";

contract MockEthAllocation is IAllocation {

	address payable beneficiary;
    uint256 total = 0;

	constructor(address payable _beneficiary) public {
		beneficiary = _beneficiary;
	}

    function deposit(uint256 amount) external override payable {
    	require(amount == msg.value, "Bonding Curve: Sent value does not equal input");
    	beneficiary.transfer(amount);
        total += amount;
    }

    function withdraw(address to, uint256 amount) external override {}

    function totalValue() external view override returns(uint256) {
    	return total;
    }

}