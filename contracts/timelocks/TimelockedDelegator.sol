// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ITimelockedDelegator.sol";
import "./LinearTokenTimelock.sol";

/// @title a proxy delegate contract for TRIBE
/// @author Fei Protocol
contract Delegatee is Ownable {
    ITribe public tribe;

    /// @notice Delegatee constructor
    /// @param _delegatee the address to delegate TRIBE to
    /// @param _tribe the TRIBE token address
    constructor(address _delegatee, address _tribe) {
        tribe = ITribe(_tribe);
        tribe.delegate(_delegatee);
    }

    /// @notice send TRIBE back to timelock and selfdestruct
    function withdraw() public onlyOwner {
        ITribe _tribe = tribe;
        uint256 balance = _tribe.balanceOf(address(this));
        _tribe.transfer(owner(), balance);
        selfdestruct(payable(owner()));
    }
}

/// @title a timelock for TRIBE allowing for sub-delegation
/// @author Fei Protocol
/// @notice allows the timelocked TRIBE to be delegated by the beneficiary while locked
contract TimelockedDelegator is ITimelockedDelegator, LinearTokenTimelock {
    /// @notice associated delegate proxy contract for a delegatee
    mapping(address => address) public override delegateContract;

    /// @notice associated delegated amount of TRIBE for a delegatee
    /// @dev Using as source of truth to prevent accounting errors by transferring to Delegate contracts
    mapping(address => uint256) public override delegateAmount;

    /// @notice the TRIBE token contract
    ITribe public override tribe;

    /// @notice the total delegated amount of TRIBE
    uint256 public override totalDelegated;

    /// @notice Delegatee constructor
    /// @param _tribe the TRIBE token address
    /// @param _beneficiary default delegate, admin, and timelock beneficiary
    /// @param _duration duration of the token timelock window
    constructor(
        address _tribe,
        address _beneficiary,
        uint256 _duration
    ) LinearTokenTimelock(_beneficiary, _duration, _tribe, 0, address(0), 0) {
        tribe = ITribe(_tribe);
        tribe.delegate(_beneficiary);
    }

    /// @notice delegate locked TRIBE to a delegatee
    /// @param delegatee the target address to delegate to
    /// @param amount the amount of TRIBE to delegate. Will increment existing delegated TRIBE
    function delegate(address delegatee, uint256 amount)
        public
        override
        onlyBeneficiary
    {
        require(
            amount <= _tribeBalance(),
            "TimelockedDelegator: Not enough Tribe"
        );

        // withdraw and include an existing delegation
        if (delegateContract[delegatee] != address(0)) {
            amount = amount + undelegate(delegatee);
        }

        ITribe _tribe = tribe;
        address _delegateContract = address(
            new Delegatee(delegatee, address(_tribe))
        );
        delegateContract[delegatee] = _delegateContract;

        delegateAmount[delegatee] = amount;
        totalDelegated = totalDelegated + amount;

        _tribe.transfer(_delegateContract, amount);

        emit Delegate(delegatee, amount);
    }

    /// @notice return delegated TRIBE to the timelock
    /// @param delegatee the target address to undelegate from
    /// @return the amount of TRIBE returned
    function undelegate(address delegatee)
        public
        override
        onlyBeneficiary
        returns (uint256)
    {
        address _delegateContract = delegateContract[delegatee];
        require(
            _delegateContract != address(0),
            "TimelockedDelegator: Delegate contract nonexistent"
        );

        Delegatee(_delegateContract).withdraw();

        uint256 amount = delegateAmount[delegatee];
        totalDelegated = totalDelegated - amount;

        delegateContract[delegatee] = address(0);
        delegateAmount[delegatee] = 0;

        emit Undelegate(delegatee, amount);

        return amount;
    }

    /// @notice calculate total TRIBE held plus delegated
    /// @dev used by LinearTokenTimelock to determine the released amount
    function totalToken() public view override returns (uint256) {
        return _tribeBalance() + totalDelegated;
    }

    /// @notice accept beneficiary role over timelocked TRIBE. Delegates all held (non-subdelegated) tribe to beneficiary
    function acceptBeneficiary() public override {
        _setBeneficiary(msg.sender);
        tribe.delegate(msg.sender);
    }

    function _tribeBalance() internal view returns (uint256) {
        return tribe.balanceOf(address(this));
    }
}
