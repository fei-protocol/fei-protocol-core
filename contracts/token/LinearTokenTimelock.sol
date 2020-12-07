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

    uint256 public lastBalance;

    uint256 public releaseTimeStart;

    // timestamp when token release is enabled
    uint256 public releaseTimeEnd;

    constructor (address _beneficiary, uint256 _releaseTimeEnd) public {
        // solhint-disable-next-line not-rely-on-time
        require(releaseTimeEnd > now, "LinearTokenTimelock: release time is before current time");
        beneficiary = _beneficiary;
        releaseTimeStart = now;
        releaseTimeEnd = _releaseTimeEnd;

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

    function totalToken() public view returns(uint256) {
        return lockedToken.balanceOf(address(this));
    }

    function alreadyReleasedAmount() public view returns(uint256) {
        return initialBalance - totalToken();
    }

    function availableForRelease() public view returns(uint256) {
        uint elapsed = now - releaseTimeStart;
        uint window = releaseTimeEnd - releaseTimeStart;

        if (elapsed > window) {
            elapsed = window;
        }

        uint totalAvailable = initialBalance * elapsed / window;
        uint netAvailable = totalAvailable - alreadyReleasedAmount();
        return netAvailable;
    }

    function release() public balanceCheck {
        uint256 amount = availableForRelease();
        require(amount > 0, "LinearTokenTimelock: no tokens to release");

        lockedToken.transfer(beneficiary, amount);
    }

    function setBeneficiary() public {
        require(msg.sender == beneficiary, "LinearTokenTimelock: Caller is not beneficiary");
        beneficiary = msg.sender;
    }

    function setLockedToken(address tokenAddress) internal {
        lockedToken = IERC20(tokenAddress);
    }
}
