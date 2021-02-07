pragma solidity ^0.6.0;

// Inspired by OpenZeppelin TokenTimelock contract
// Reference: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/TokenTimelock.sol

import "./Timed.sol";
import "../external/SafeMathCopy.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LinearTokenTimelock is Timed {
    using SafeMathCopy for uint;

    // ERC20 basic token contract being held
    IERC20 public lockedToken;

    // beneficiary of tokens after they are released
    address public beneficiary;

    address public pendingBeneficiary;

    uint public initialBalance;

    uint internal lastBalance;

    event Release(address indexed _beneficiary, uint _amount);
    event BeneficiaryUpdate(address indexed _beneficiary);
    event PendingBeneficiaryUpdate(address indexed _pendingBeneficiary);

    constructor (address _beneficiary, uint _duration, address _lockedToken) public Timed(_duration) {
        require(_duration != 0, "LinearTokenTimelock: duration is 0");
        require(_beneficiary != address(0), "LinearTokenTimelock: Beneficiary must not be 0 address");

        beneficiary = _beneficiary;
        _initTimed();

        _setLockedToken(_lockedToken);
    }

    // Prevents incoming LP tokens from messing up calculations
    modifier balanceCheck() {
        if (totalToken() > lastBalance) {
            uint delta = totalToken().sub(lastBalance);
            initialBalance = initialBalance.add(delta);
        }
        _;
        lastBalance = totalToken();
    }

    modifier onlyBeneficiary() {
        require(msg.sender == beneficiary, "LinearTokenTimelock: Caller is not a beneficiary");
        _;
    }

    function release() external onlyBeneficiary balanceCheck {
        uint amount = availableForRelease();
        require(amount != 0, "LinearTokenTimelock: no tokens to release");

        lockedToken.transfer(beneficiary, amount);
        emit Release(beneficiary, amount);
    }

    function totalToken() public view virtual returns(uint) {
        return lockedToken.balanceOf(address(this));
    }

    function alreadyReleasedAmount() public view returns(uint) {
        return initialBalance.sub(totalToken());
    }

    function availableForRelease() public view returns(uint) {
        uint elapsed = timeSinceStart();
        uint _duration = duration;

        uint totalAvailable = initialBalance.mul(elapsed) / _duration;
        uint netAvailable = totalAvailable.sub(alreadyReleasedAmount());
        return netAvailable;
    }

    function setPendingBeneficiary(address _pendingBeneficiary) public onlyBeneficiary {
        pendingBeneficiary = _pendingBeneficiary;
        emit PendingBeneficiaryUpdate(_pendingBeneficiary);
    }

    function acceptBeneficiary() public virtual {
        _setBeneficiary(msg.sender);
    }

    function _setBeneficiary(address newBeneficiary) internal {
        require(newBeneficiary == pendingBeneficiary, "LinearTokenTimelock: Caller is not pending beneficiary");
        beneficiary = newBeneficiary;
        emit BeneficiaryUpdate(newBeneficiary);
        pendingBeneficiary = address(0);
    }

    function _setLockedToken(address tokenAddress) internal {
        lockedToken = IERC20(tokenAddress);
    }
}
