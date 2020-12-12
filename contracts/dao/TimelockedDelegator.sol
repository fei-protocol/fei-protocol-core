pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../token/LinearTokenTimelock.sol";
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

	function withdraw() public onlyOwner returns(uint) {
		uint balance = tribe.balanceOf(address(this));
		tribe.transfer(owner(), balance);
		return balance;
	}
}

contract TimelockedDelegator is LinearTokenTimelock {

	uint constant public RELEASE_WINDOW = 4 * 365 * 24 * 60 * 60; // 4 years vesting

    mapping (address => address) public delegateContracts;

    ITribe public tribe;
    uint public delegatedAmount;

	constructor(address _tribe, address _beneficiary) public
		LinearTokenTimelock(_beneficiary, RELEASE_WINDOW)
	{
		tribe = ITribe(_tribe);
		tribe.delegate(_beneficiary);
		setLockedToken(_tribe);
	}

	function delegate(address delegatee, uint amount) public onlyBeneficiary {
		require(amount <= tribeBalance(), "TimelockedDelegator: Not enough Tribe");
		if (delegateContracts[delegatee] != address(0)) {
			amount += undelegate(delegatee);
		}
		address delegateContract = address(new Delegatee(delegatee, address(tribe)));
		delegateContracts[delegatee] = delegateContract;
		delegatedAmount += amount;
		tribe.transfer(delegateContract, amount);
	}

	function undelegate(address delegatee) public onlyBeneficiary returns(uint) {
		require(delegateContracts[delegatee] != address(0), "TimelockedDelegator: Delegate contract nonexistent");
		uint amount = Delegatee(delegateContracts[delegatee]).withdraw();
		delegatedAmount -= amount;
		delegateContracts[delegatee] = address(0);
		return amount;
	}

	function totalToken() public view override returns(uint256) {
        return tribeBalance() + delegatedAmount;
    }

	function setBeneficiary(address newBeneficiary) public override onlyBeneficiary {
        beneficiary = newBeneficiary;
        tribe.delegate(newBeneficiary);
    }

    function tribeBalance() internal view returns (uint256) {
    	return tribe.balanceOf(address(this));
    }
}
