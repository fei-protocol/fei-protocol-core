pragma solidity ^0.6.0;

// Inspired by OpenZeppelin TokenTimelock contract
// Reference: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/TokenTimelock.sol

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LinearTokenTimelock {

    // ERC20 basic token contract being held
    IERC20 public lockedToken;

    // beneficiary of tokens after they are released
    address public beneficiary;

    uint256 public initialBalance;

    uint256 internal lastBalance;

    uint256 public releaseTimeStart;

    uint256 public duration;

    event Release(address indexed _beneficiary, uint _amount);
    event BeneficiaryUpdate(address indexed _beneficiary);

    constructor (address _beneficiary, uint256 _duration) public {
        require(_duration != 0, "LinearTokenTimelock: duration is 0");
        beneficiary = _beneficiary;
        // solhint-disable-next-line not-rely-on-time
        releaseTimeStart = now;
        duration = _duration;

    }

    // Prevents incoming LP tokens from messing up calculations
    modifier balanceCheck() {
        if (totalToken() > lastBalance) {
            uint delta = totalToken() - lastBalance;
            initialBalance += delta;
        }
        _;
        lastBalance = totalToken();
    }

    modifier onlyBeneficiary() {
        require(msg.sender == beneficiary, "LinearTokenTimelock: Caller is not a beneficiary");
        _;
    }

    function release() external onlyBeneficiary balanceCheck {
        uint256 amount = availableForRelease();
        require(amount != 0, "LinearTokenTimelock: no tokens to release");

        lockedToken.transfer(beneficiary, amount);
        emit Release(beneficiary, amount);
    }

    function totalToken() public view virtual returns(uint256) {
        return lockedToken.balanceOf(address(this));
    }

    function alreadyReleasedAmount() public view returns(uint256) {
        return initialBalance - totalToken();
    }

    function availableForRelease() public view returns(uint256) {
        // solhint-disable-next-line not-rely-on-time
        uint elapsed = now - releaseTimeStart;
        uint _duration = duration;

        if (elapsed > _duration) {
            elapsed = _duration;
        }

        uint totalAvailable = initialBalance * elapsed / _duration;
        uint netAvailable = totalAvailable - alreadyReleasedAmount();
        return netAvailable;
    }

    function setBeneficiary(address newBeneficiary) public virtual onlyBeneficiary {
        beneficiary = newBeneficiary;
        emit BeneficiaryUpdate(newBeneficiary);
    }

    function setLockedToken(address tokenAddress) internal {
        lockedToken = IERC20(tokenAddress);
    }
}
