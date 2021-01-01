pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ITimelockedDelegator.sol";
import "../utils/LinearTokenTimelock.sol";

/// @title a proxy delegate contract for TRIBE
/// @author Fei Protocol
contract Delegatee is Ownable {

	ITribe public tribe;

	/// @notice Delegatee constructor
	/// @param _delegatee the address to delegate TRIBE to
	/// @param _tribe the TRIBE token address
	constructor(address _delegatee, address _tribe) public {
		tribe = ITribe(_tribe);
		tribe.delegate(_delegatee);
	}

	/// @notice send TRIBE back to timelock and selfdestruct
	function withdraw() public onlyOwner {
		ITribe _tribe = tribe;
		uint balance = _tribe.balanceOf(address(this));
		_tribe.transfer(owner(), balance);
		selfdestruct(payable(owner()));
	}
}

/// @title ITimelockedDelegator implementation
/// @author Fei Protocol
contract TimelockedDelegator is ITimelockedDelegator, LinearTokenTimelock {

    mapping (address => address) public override delegateContract;

    mapping (address => uint) public override delegateAmount;

    ITribe public override tribe;

    uint public override totalDelegated;

	/// @notice Delegatee constructor
	/// @param _tribe the TRIBE token address
	/// @param _beneficiary default delegate, admin, and timelock beneficiary
	/// @param _duration duration of the token timelock window
	constructor(address _tribe, address _beneficiary, uint32 _duration) public
		LinearTokenTimelock(_beneficiary, _duration)
	{
		tribe = ITribe(_tribe);
		tribe.delegate(_beneficiary);
		setLockedToken(_tribe);
	}

	function delegate(address delegatee, uint amount) public override onlyBeneficiary {
		require(amount <= tribeBalance(), "TimelockedDelegator: Not enough Tribe");

		if (delegateContract[delegatee] != address(0)) {
			amount += undelegate(delegatee);
		}
		ITribe _tribe = tribe;
		address _delegateContract = address(new Delegatee(delegatee, address(_tribe)));
		delegateContract[delegatee] = _delegateContract;

		delegateAmount[delegatee] = amount;
		totalDelegated += amount;

		_tribe.transfer(_delegateContract, amount);

		emit Delegate(delegatee, amount);
	}

	function undelegate(address delegatee) public override onlyBeneficiary returns(uint) {
		address _delegateContract = delegateContract[delegatee];
		require(_delegateContract != address(0), "TimelockedDelegator: Delegate contract nonexistent");

		Delegatee(_delegateContract).withdraw();

		uint amount = delegateAmount[delegatee];
		totalDelegated -= amount;

		delegateContract[delegatee] = address(0);
		delegateAmount[delegatee] = 0;

		emit Undelegate(delegatee, amount);

		return amount;
	}

	/// @notice calculate total TRIBE held plus delegated
	/// @dev used by LinearTokenTimelock to determine the released amount
	function totalToken() public view override returns(uint256) {
        return tribeBalance() + totalDelegated;
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
