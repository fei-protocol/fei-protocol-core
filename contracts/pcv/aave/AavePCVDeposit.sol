// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../utils/WethPCVDeposit.sol";

interface LendingPool {
    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    
    function withdraw(address asset, uint256 amount, address to) external;
}

interface IncentivesController {
    function claimRewards(address[] calldata assets, uint256 amount, address to) external;

    function getRewardsBalance(address[] calldata assets, address user) external view returns(uint256);
}

/// @title Aave PCV Deposit
/// @author Fei Protocol
contract AavePCVDeposit is WethPCVDeposit {

    IERC20 public aToken;
    LendingPool public lendingPool;
    IERC20 public token;
    IncentivesController public incentivesController;

    /// @notice Aave PCV Deposit constructor
    /// @param _core Fei Core for reference
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

    function claimRewards() external {
        address[] memory assets = new address[](1);
        assets[0] = address(token);
        uint256 amount = incentivesController.getRewardsBalance(assets, address(this));

        incentivesController.claimRewards(assets, amount, address(this));
    }

    /// @notice deposit buffered aTokens
    function deposit() external override whenNotPaused {
        uint256 pendingBalance = token.balanceOf(address(this));
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
        whenNotPaused
    {
        lendingPool.withdraw(address(token), amountUnderlying, to);
        emit Withdrawal(msg.sender, to, amountUnderlying);
    }

    /// @notice returns total balance of PCV in the Deposit
    function balance() public view override returns (uint256) {
        return aToken.balanceOf(address(this));
    }
}
