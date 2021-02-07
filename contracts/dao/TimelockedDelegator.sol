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
        uint256 balance = _tribe.balanceOf(address(this));
        _tribe.transfer(owner(), balance);
        selfdestruct(payable(owner()));
    }
}

/// @title ITimelockedDelegator implementation
/// @author Fei Protocol
contract TimelockedDelegator is ITimelockedDelegator, LinearTokenTimelock {
    mapping(address => address) public override delegateContract;

    mapping(address => uint256) public override delegateAmount;

    ITribe public override tribe;

    uint256 public override totalDelegated;

    /// @notice Delegatee constructor
    /// @param _tribe the TRIBE token address
    /// @param _beneficiary default delegate, admin, and timelock beneficiary
    /// @param _duration duration of the token timelock window
    constructor(
        address _tribe,
        address _beneficiary,
        uint256 _duration
    ) public LinearTokenTimelock(_beneficiary, _duration, _tribe) {
        tribe = ITribe(_tribe);
        tribe.delegate(_beneficiary);
    }

    function delegate(address delegatee, uint256 amount)
        public
        override
        onlyBeneficiary
    {
        require(
            amount <= _tribeBalance(),
            "TimelockedDelegator: Not enough Tribe"
        );

        if (delegateContract[delegatee] != address(0)) {
            amount = amount.add(undelegate(delegatee));
        }
        ITribe _tribe = tribe;
        address _delegateContract = address(new Delegatee(delegatee, address(_tribe)));
        delegateContract[delegatee] = _delegateContract;

        delegateAmount[delegatee] = amount;
        totalDelegated = totalDelegated.add(amount);

        _tribe.transfer(_delegateContract, amount);

        emit Delegate(delegatee, amount);
    }

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
        totalDelegated = totalDelegated.sub(amount);

        delegateContract[delegatee] = address(0);
        delegateAmount[delegatee] = 0;

        emit Undelegate(delegatee, amount);

        return amount;
    }

    /// @notice calculate total TRIBE held plus delegated
    /// @dev used by LinearTokenTimelock to determine the released amount
    function totalToken() public view override returns (uint256) {
        return _tribeBalance().add(totalDelegated);
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
