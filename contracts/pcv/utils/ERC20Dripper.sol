pragma solidity ^0.8.4;

import "./../PCVDeposit.sol";
import "./../../utils/Timed.sol";

contract ERC20Dripper is PCVDeposit, Timed {
    using Address for address payable;

    /// @notice event emitted when tokens are dripped
    event Dripped(uint256 amount);

    /// @notice target address to drip tokens to
    address public target;
    /// @notice target token address to send
    address public token;
    /// @notice amount to drip after each window
    uint256 public amountToDrip;

    /// @notice ERC20 PCV Dripper constructor
    /// @param _core Fei Core for reference
    /// @param _target address to drip to
    /// @param _frequency frequency of dripping
    /// @param _amountToDrip amount to drip on each drip
    /// @param _token amount to drip on each drip
    constructor(
        address _core,
        address _target,
        uint256 _frequency,
        uint256 _amountToDrip,
        address _token
    ) CoreRef(_core) Timed(_frequency) {
        require(_target != address(0), "ERC20Dripper: invalid address");
        require(_token != address(0), "ERC20Dripper: invalid token address");
        require(_amountToDrip > 0, "ERC20Dripper: invalid drip amount");

        target = _target;
        amountToDrip = _amountToDrip;
        token = _token;

        // start timer
        _initTimed();
    }

    /// @notice drip ERC20 tokens to target
    function drip() external afterTime whenNotPaused {
        // reset timer
        _initTimed();

        // drip
        _withdrawERC20(token, target, amountToDrip);
        emit Dripped(amountToDrip);
    }

    /// @notice withdraw tokens from the PCV allocation
    /// @param amountUnderlying of tokens withdrawn
    /// @param to the address to send PCV to
    function withdraw(address to, uint256 amountUnderlying)
        external
        override
        onlyPCVController
    {
        _withdrawERC20(address(token), to, amountUnderlying);
    }

    /// @notice no-op
    function deposit() external override {}

    /// @notice returns total balance of PCV in the Deposit
    function balance() public view override returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /// @notice display the related token of the balance reported
    function balanceReportedIn() public view override returns (address) {
        return token;
    }
}
