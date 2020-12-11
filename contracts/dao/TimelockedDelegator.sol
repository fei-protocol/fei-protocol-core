pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../token/LinearTokenTimelock.sol";
import "../refs/CoreRef.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ITribe is IERC20 {
	function delegate(address delegatee) external;
}

contract Delegatee is Ownable {
	ITribe public tribe;

	constructor(address delegatee, address _tribe) public {
		tribe = ITribe(_tribe);
		tribe.delegate(delegatee);
	}

	function withdraw() public onlyOwner {
		uint balance = tribe.balanceOf(address(this));
		tribe.transfer(owner(), balance);
	}
}

contract TimelockedDelegator is LinearTokenTimelock, CoreRef {

	uint constant public RELEASE_WINDOW =  4 * 365 * 24 * 60 * 60; // 4 years vesting

    mapping (address => address) public delegateContracts;

    ITribe public TRIBE;

	constructor(address core, address _beneficiary) public
		CoreRef(core)
		LinearTokenTimelock(_beneficiary, RELEASE_WINDOW)
	{
		TRIBE = ITribe(address(tribe()));
		TRIBE.delegate(_beneficiary);
	}

	function delegate(address delegatee, uint amount) public {
		require(msg.sender == beneficiary, "TimelockedDelegator: Caller is not beneficiary");
		address delegateContract = address(new Delegatee(delegatee, address(TRIBE)));
		delegateContracts[delegatee] = delegateContract;
		TRIBE.transfer(delegatee, amount);
	}

	function undelegate(address delegatee) public {
		require(msg.sender == beneficiary, "TimelockedDelegator: Caller is not beneficiary");
		Delegatee(delegateContracts[delegatee]).withdraw();
	}

	function setBeneficiary(address newBeneficiary) public override {
        require(msg.sender == beneficiary, "TimelockedDelegator: Caller is not beneficiary");
        beneficiary = newBeneficiary;
        TRIBE.delegate(newBeneficiary);
    }
}
