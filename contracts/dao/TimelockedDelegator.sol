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

    ITribe public _tribe;

	constructor(address core, address _beneficiary) public
		CoreRef(core)
		LinearTokenTimelock(_beneficiary, RELEASE_WINDOW)
	{
		_tribe = ITribe(address(tribe()));
		_tribe.delegate(_beneficiary);
	}

	function delegate(address delegatee, uint amount) public {
		require(msg.sender == beneficiary, "TimelockedDelegator: Caller is not beneficiary");
		address delegateContract = address(new Delegatee(delegatee, address(_tribe)));
		delegateContracts[delegatee] = delegateContract;
		_tribe.transfer(delegatee, amount);
	}

	function undelegate(address delegatee) public {
		require(msg.sender == beneficiary, "TimelockedDelegator: Caller is not beneficiary");
		Delegatee(delegateContracts[delegatee]).withdraw();
	}

	function setBeneficiary(address newBeneficiary) public override {
        require(msg.sender == beneficiary, "TimelockedDelegator: Caller is not beneficiary");
        beneficiary = newBeneficiary;
        _tribe.delegate(newBeneficiary);
    }
}
