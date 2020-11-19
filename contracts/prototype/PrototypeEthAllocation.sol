pragma solidity ^0.6.0;

import "../bondingcurve/IAllocation.sol";

contract PrototypeEthAllocation is IAllocation {

	address payable beneficiary;

	constructor(address payable _beneficiary) public {
		beneficiary = _beneficiary;
	}

    function deposit(uint256 amount) override external payable {
    	require(amount == msg.value, "Bonding Curve: Sent value does not equal input");
    	beneficiary.transfer(amount);
    }

    function totalValue() override external view returns(uint256) {
    	return 0;
    }

    function withdraw(uint256 amount) override external {

    }
 
}