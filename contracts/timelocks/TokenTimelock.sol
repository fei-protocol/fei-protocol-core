// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

// Inspired by OpenZeppelin TokenTimelock contract
// Reference: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/TokenTimelock.sol

import "../utils/Timed.sol";
import "./ITokenTimelock.sol";

abstract contract TokenTimelock is ITokenTimelock, Timed {

    /// @notice ERC20 basic token contract being held in timelock
    IERC20 public override lockedToken;

    /// @notice beneficiary of tokens after they are released
    address public override beneficiary;

    /// @notice pending beneficiary appointed by current beneficiary
    address public override pendingBeneficiary;

    /// @notice initial balance of lockedToken
    uint256 public override initialBalance;

    uint256 internal lastBalance;

    /// @notice number of seconds before releasing is allowed
    uint256 public immutable cliffSeconds;

    address public immutable clawbackAdmin;

    constructor(
        address _beneficiary,
        uint256 _duration,
        uint256 _cliffSeconds,
        address _lockedToken,
        address _clawbackAdmin
    ) Timed(_duration) {
        require(_duration != 0, "TokenTimelock: duration is 0");
        require(
            _beneficiary != address(0),
            "TokenTimelock: Beneficiary must not be 0 address"
        );

        beneficiary = _beneficiary;
        _initTimed();

        _setLockedToken(_lockedToken);

        cliffSeconds = _cliffSeconds;

        clawbackAdmin = _clawbackAdmin;
    }

    // Prevents incoming LP tokens from messing up calculations
    modifier balanceCheck() {
        if (totalToken() > lastBalance) {
            uint256 delta = totalToken() - lastBalance;
            initialBalance = initialBalance + delta;
        }
        _;
        lastBalance = totalToken();
    }

    modifier onlyBeneficiary() {
        require(
            msg.sender == beneficiary,
            "TokenTimelock: Caller is not a beneficiary"
        );
        _;
    }

    /// @notice releases `amount` unlocked tokens to address `to`
    function release(address to, uint256 amount) external override onlyBeneficiary balanceCheck {
        require(amount != 0, "TokenTimelock: no amount desired");
        require(passedCliff(), "TokenTimelock: Cliff not passed");

        uint256 available = availableForRelease();
        require(amount <= available, "TokenTimelock: not enough released tokens");

        _release(to, amount);
    }

    /// @notice releases maximum unlocked tokens to address `to`
    function releaseMax(address to) external override onlyBeneficiary balanceCheck {
        require(passedCliff(), "TokenTimelock: Cliff not passed");
        _release(to, availableForRelease());
    }

    /// @notice the total amount of tokens held by timelock
    function totalToken() public view override virtual returns (uint256) {
        return lockedToken.balanceOf(address(this));
    }

    /// @notice amount of tokens released to beneficiary
    function alreadyReleasedAmount() public view override returns (uint256) {
        return initialBalance - totalToken();
    }

    /// @notice amount of held tokens unlocked and available for release
    function availableForRelease() public view override returns (uint256) {
        uint256 elapsed = timeSinceStart();

        uint256 totalAvailable = _proportionAvailable(initialBalance, elapsed, duration);
        uint256 netAvailable = totalAvailable - alreadyReleasedAmount();
        return netAvailable;
    }

    /// @notice current beneficiary can appoint new beneficiary, which must be accepted
    function setPendingBeneficiary(address _pendingBeneficiary)
        public
        override
        onlyBeneficiary
    {
        pendingBeneficiary = _pendingBeneficiary;
        emit PendingBeneficiaryUpdate(_pendingBeneficiary);
    }

    /// @notice pending beneficiary accepts new beneficiary
    function acceptBeneficiary() public override virtual {
        _setBeneficiary(msg.sender);
    }

    function clawback() public balanceCheck {
        require(msg.sender == clawbackAdmin, "TokenTimelock: Only clawbackAdmin");
        if (passedCliff()) {
            _release(beneficiary, availableForRelease());
        }
        _release(clawbackAdmin, totalToken());
    }

    function passedCliff() public view returns (bool) {
        return timeSinceStart() >= cliffSeconds;
    }

    function _proportionAvailable(uint256 initialBalance, uint256 elapsed, uint256 duration) internal pure virtual returns (uint256);

    function _setBeneficiary(address newBeneficiary) internal {
        require(
            newBeneficiary == pendingBeneficiary,
            "TokenTimelock: Caller is not pending beneficiary"
        );
        beneficiary = newBeneficiary;
        emit BeneficiaryUpdate(newBeneficiary);
        pendingBeneficiary = address(0);
    }

    function _setLockedToken(address tokenAddress) internal {
        lockedToken = IERC20(tokenAddress);
    }

    function _release(address to, uint256 amount) internal {
        lockedToken.transfer(to, amount);
        emit Release(beneficiary, to, amount);
    }
}
