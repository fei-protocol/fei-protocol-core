pragma solidity ^0.6.0;

// Inspired by OpenZeppelin TokenTimelock contract
// Reference: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/TokenTimelock.sol

import "./Timed.sol";
import "../external/SafeMathCopy.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LinearTokenTimelock is Timed {
    using SafeMathCopy for uint256;

    /// @notice ERC20 basic token contract being held in timelock
    IERC20 public lockedToken;

    /// @notice beneficiary of tokens after they are released
    address public beneficiary;

    /// @notice pending beneficiary appointed by current beneficiary
    address public pendingBeneficiary;

    /// @notice initial balance of lockedToken
    uint256 public initialBalance;

    uint256 internal lastBalance;

    event Release(address indexed _beneficiary, uint256 _amount);
    event BeneficiaryUpdate(address indexed _beneficiary);
    event PendingBeneficiaryUpdate(address indexed _pendingBeneficiary);

    constructor(
        address _beneficiary,
        uint256 _duration,
        address _lockedToken
    ) public Timed(_duration) {
        require(_duration != 0, "LinearTokenTimelock: duration is 0");
        require(
            _beneficiary != address(0),
            "LinearTokenTimelock: Beneficiary must not be 0 address"
        );

        beneficiary = _beneficiary;
        _initTimed();

        _setLockedToken(_lockedToken);
    }

    // Prevents incoming LP tokens from messing up calculations
    modifier balanceCheck() {
        if (totalToken() > lastBalance) {
            uint256 delta = totalToken().sub(lastBalance);
            initialBalance = initialBalance.add(delta);
        }
        _;
        lastBalance = totalToken();
    }

    modifier onlyBeneficiary() {
        require(
            msg.sender == beneficiary,
            "LinearTokenTimelock: Caller is not a beneficiary"
        );
        _;
    }

    /// @notice releases unlocked tokens to beneficiary
    function release() external onlyBeneficiary balanceCheck {
        uint256 amount = availableForRelease();
        require(amount != 0, "LinearTokenTimelock: no tokens to release");

        lockedToken.transfer(beneficiary, amount);
        emit Release(beneficiary, amount);
    }

    /// @notice the total amount of tokens held by timelock
    function totalToken() public view virtual returns (uint256) {
        return lockedToken.balanceOf(address(this));
    }

    /// @notice amount of tokens released to beneficiary
    function alreadyReleasedAmount() public view returns (uint256) {
        return initialBalance.sub(totalToken());
    }

    /// @notice amount of held tokens unlocked and available for release
    function availableForRelease() public view returns (uint256) {
        uint256 elapsed = timeSinceStart();
        uint256 _duration = duration;

        uint256 totalAvailable = initialBalance.mul(elapsed) / _duration;
        uint256 netAvailable = totalAvailable.sub(alreadyReleasedAmount());
        return netAvailable;
    }

    /// @notice current beneficiary can appoint new beneficiary, which must be accepted
    function setPendingBeneficiary(address _pendingBeneficiary)
        public
        onlyBeneficiary
    {
        pendingBeneficiary = _pendingBeneficiary;
        emit PendingBeneficiaryUpdate(_pendingBeneficiary);
    }

    /// @notice pending beneficiary accepts new beneficiary
    function acceptBeneficiary() public virtual {
        _setBeneficiary(msg.sender);
    }

    function _setBeneficiary(address newBeneficiary) internal {
        require(
            newBeneficiary == pendingBeneficiary,
            "LinearTokenTimelock: Caller is not pending beneficiary"
        );
        beneficiary = newBeneficiary;
        emit BeneficiaryUpdate(newBeneficiary);
        pendingBeneficiary = address(0);
    }

    function _setLockedToken(address tokenAddress) internal {
        lockedToken = IERC20(tokenAddress);
    }
}
