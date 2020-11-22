pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../allocation/IAllocation.sol";

contract PrototypeEthAllocation is IAllocation {

	address payable beneficiary;

	constructor(address payable _beneficiary) public {
		beneficiary = _beneficiary;
	}

    function deposit(uint256 amount) external override payable {
    	require(amount == msg.value, "Bonding Curve: Sent value does not equal input");
    	beneficiary.transfer(amount);
    }

    function withdraw(uint256 amount) external override {}

    function totalValue() external view override returns(uint256) {
    	return 0;
    }

}