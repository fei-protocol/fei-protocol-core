pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../utils/LinearTokenTimelock.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ITribe is IERC20 {
	function delegate(address delegatee) external;
}

/// @title a proxy delegate contract for TRIBE
/// @author Fei Protocol
contract Delegatee is Ownable {
	ITribe public tribe;

	constructor(address delegatee, address _tribe) public {
		tribe = ITribe(_tribe);
		tribe.delegate(delegatee);
	}

	/// @notice send TRIBE back to timelock and selfdestruct
	function withdraw() public onlyOwner {
		ITribe _tribe = tribe;
		uint balance = _tribe.balanceOf(address(this));
		_tribe.transfer(owner(), balance);
		selfdestruct(payable(owner()));
	}
}

/// @title a timelock for TRIBE allowing for sub-delegation
/// @author Fei Protocol
/// @notice allows the timelocked TRIBE to be delegated by the beneficiary while locked
contract TimelockedDelegator is LinearTokenTimelock {

	/// @notice associated delegate proxy contract for a delegatee
	/// @param address The delegatee
	/// @return the corresponding delegate proxy contract
    mapping (address => address) public delegateContracts;

	/// @notice associated delegated amount for a delegatee
	/// @param address The delegatee
	/// @return uint amount of TRIBE delegated
    /// @dev Using as source of truth to prevent accounting errors by transferring to Delegate contracts
    mapping (address => uint) public delegateAmounts;

	/// @notice the TRIBE token contract
    ITribe public tribe;
	/// @notice the total delegated amount of TRIBE
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

	/// @notice delegate locked TRIBE to a delegatee
	/// @param delegatee the target address to delegate to
	/// @param amount the amount of TRIBE to delegate. Will increment existing delegated TRIBE.
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

	/// @notice return delegated TRIBE to the timelock
	/// @param delegatee the target address to undelegate from
	/// @return the amount of TRIBE returned
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

	/// @notice calculate total TRIBE held plus delegated
	/// @dev used by LinearTokenTimelock to determine the released amount
	function totalToken() public view override returns(uint256) {
        return tribeBalance() + delegatedAmount;
    }

	/// @notice accept beneficiary role over timelocked TRIBE. Delegates all held (non-subdelegated) tribe to beneficiary
	function acceptBeneficiary() public override {
        _setBeneficiary(msg.sender);
        tribe.delegate(msg.sender);
    }

    function tribeBalance() internal view returns (uint256) {
    	return tribe.balanceOf(address(this));
    }
}
