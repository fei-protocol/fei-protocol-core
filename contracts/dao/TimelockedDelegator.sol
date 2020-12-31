pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../utils/LinearTokenTimelock.sol";
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
		ITribe _tribe = tribe;
		uint balance = _tribe.balanceOf(address(this));
		_tribe.transfer(owner(), balance);
		selfdestruct(payable(owner()));
	}
}

contract TimelockedDelegator is LinearTokenTimelock {
    mapping (address => address) public delegateContracts;
    // Using as source of truth to prevent accounting errors by transferring to Delegate contracts
    mapping (address => uint) public delegateAmounts;

    ITribe public tribe;
    uint public delegatedAmount;

    event Delegate(address indexed _delegatee, uint _amount);
    event Undelegate(address indexed _delegatee, uint _amount);

	constructor(address _tribe, address _beneficiary, uint32 _duration) public
		LinearTokenTimelock(_beneficiary, _duration)
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
		ITribe _tribe = tribe;
		address delegateContract = address(new Delegatee(delegatee, address(_tribe)));
		delegateContracts[delegatee] = delegateContract;
		delegateAmounts[delegatee] = amount;
		delegatedAmount += amount;
		_tribe.transfer(delegateContract, amount);
		emit Delegate(delegatee, amount);
	}

	function undelegate(address delegatee) public onlyBeneficiary returns(uint) {
		address delegateContract = delegateContracts[delegatee];
		require(delegateContract != address(0), "TimelockedDelegator: Delegate contract nonexistent");
		Delegatee(delegateContract).withdraw();
		uint amount = delegateAmounts[delegatee];
		delegatedAmount -= amount;
		delegateContracts[delegatee] = address(0);
		delegateAmounts[delegatee] = 0;
		emit Undelegate(delegatee, amount);
		return amount;
	}

	// Used for Timelock to calculate how much to release
	function totalToken() public view override returns(uint256) {
        return tribeBalance() + delegatedAmount;
    }

	function acceptBeneficiary() public override {
        _setBeneficiary(msg.sender);
        tribe.delegate(msg.sender);
    }

    function tribeBalance() internal view returns (uint256) {
    	return tribe.balanceOf(address(this));
    }
}
