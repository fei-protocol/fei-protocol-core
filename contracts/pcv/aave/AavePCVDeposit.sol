// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../utils/WethPCVDeposit.sol";

interface LendingPool {
    function deposit(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external;
}

interface IncentivesController {
    function claimRewards(
        address[] calldata assets,
        uint256 amount,
        address to
    ) external;

    function getRewardsBalance(address[] calldata assets, address user)
        external
        view
        returns (uint256);
}

/// @title Aave PCV Deposit
/// @author Fei Protocol
contract AavePCVDeposit is WethPCVDeposit {
    event ClaimRewards(address indexed caller, uint256 amount);

    /// @notice the associated Aave aToken for the deposit
    IERC20 public aToken;

    /// @notice the Aave v2 lending pool
    LendingPool public lendingPool;

    /// @notice the underlying token of the PCV deposit
    IERC20 public token;

    /// @notice the Aave incentives controller for the aToken
    IncentivesController public incentivesController;

    /// @notice Aave PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _lendingPool the Aave v2 lending pool
    /// @param _token the underlying token of the PCV deposit
    /// @param _aToken the associated Aave aToken for the deposit
    /// @param _incentivesController the Aave incentives controller for the aToken
    constructor(
        address _core,
        LendingPool _lendingPool,
        IERC20 _token,
        IERC20 _aToken,
        IncentivesController _incentivesController
    ) CoreRef(_core) {
        lendingPool = _lendingPool;
        aToken = _aToken;
        token = _token;
        incentivesController = _incentivesController;
    }

    /// @notice claims Aave rewards from the deposit and transfers to this address
    function claimRewards() external {
        address[] memory assets = new address[](1);
        assets[0] = address(aToken);
        // First grab the available balance
        uint256 amount = incentivesController.getRewardsBalance(
            assets,
            address(this)
        );

        // claim all available rewards
        incentivesController.claimRewards(assets, amount, address(this));

        emit ClaimRewards(msg.sender, amount);
    }

    /// @notice deposit buffered aTokens
    function deposit() external override whenNotPaused {
        // wrap any held ETH if present
        wrapETH();

        // Approve and deposit buffered tokens
        uint256 pendingBalance = token.balanceOf(address(this));
        token.approve(address(lendingPool), pendingBalance);
        lendingPool.deposit(address(token), pendingBalance, address(this), 0);

        emit Deposit(msg.sender, pendingBalance);
    }

    /// @notice withdraw tokens from the PCV allocation
    /// @param amountUnderlying of tokens withdrawn
    /// @param to the address to send PCV to
    function withdraw(address to, uint256 amountUnderlying)
        external
        override
        onlyPCVController
    {
        lendingPool.withdraw(address(token), amountUnderlying, to);
        emit Withdrawal(msg.sender, to, amountUnderlying);
    }

    /// @notice returns total balance of PCV in the Deposit
    /// @dev aTokens are rebasing, so represent 1:1 on underlying value
    function balance() public view override returns (uint256) {
        return aToken.balanceOf(address(this));
    }

    /// @notice display the related token of the balance reported
    function balanceReportedIn() public view override returns (address) {
        return address(token);
    }
}
