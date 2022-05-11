// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./IConvexBooster.sol";
import "./IConvexBaseRewardPool.sol";
import "../curve/ICurvePool.sol";
import "../PCVDeposit.sol";

/// @title ConvexPCVDeposit: implementation for a PCVDeposit that stake/unstake
/// the Curve LP tokens on Convex, and can claim rewards.
/// @author Fei Protocol
contract ConvexPCVDeposit is PCVDeposit {
    // ------------------ Properties -------------------------------------------

    /// @notice The Curve pool to deposit in
    ICurvePool public curvePool;
    /// @notice The Convex Booster contract (for deposit/withdraw)
    IConvexBooster public convexBooster;
    /// @notice The Convex Rewards contract (for claiming rewards)
    IConvexBaseRewardPool public convexRewards;

    /// @notice number of coins in the Curve pool
    uint256 private constant N_COINS = 3;
    /// @notice boolean to know if FEI is in the pool
    bool private immutable feiInPool;
    /// @notice FEI index in the pool. If FEI is not present, value = 0.
    uint256 private immutable feiIndexInPool;

    // ------------------ Constructor ------------------------------------------

    /// @notice ConvexPCVDeposit constructor
    /// @param _core Fei Core for reference
    /// @param _curvePool The Curve pool whose LP tokens are staked
    /// @param _convexBooster The Convex Booster contract (for deposit/withdraw)
    /// @param _convexRewards The Convex Rewards contract (for claiming rewards)
    constructor(
        address _core,
        address _curvePool,
        address _convexBooster,
        address _convexRewards
    ) CoreRef(_core) {
        convexBooster = IConvexBooster(_convexBooster);
        convexRewards = IConvexBaseRewardPool(_convexRewards);
        curvePool = ICurvePool(_curvePool);

        // cache some values for later gas optimizations
        address feiAddress = address(fei());
        bool foundFeiInPool = false;
        uint256 feiFoundAtIndex = 0;
        for (uint256 i = 0; i < N_COINS; i++) {
            address tokenAddress = curvePool.coins(i);
            if (tokenAddress == feiAddress) {
                foundFeiInPool = true;
                feiFoundAtIndex = i;
            }
        }
        feiInPool = foundFeiInPool;
        feiIndexInPool = feiFoundAtIndex;
    }

    /// @notice Curve/Convex deposits report their balance in LP tokens
    function balanceReportedIn() public view override returns (address) {
        return address(curvePool);
    }

    /// @notice deposit Curve LP tokens on Convex and stake deposit tokens in the
    /// Convex rewards contract.
    /// Note : this call is permissionless, and can be used if LP tokens are
    /// transferred to this contract directly.
    function deposit() public override whenNotPaused {
        uint256 lpTokenBalance = curvePool.balanceOf(address(this));
        uint256 poolId = convexRewards.pid();
        curvePool.approve(address(convexBooster), lpTokenBalance);
        convexBooster.deposit(poolId, lpTokenBalance, true);
    }

    /// @notice unstake LP tokens from Convex Rewards, and withdraw Curve
    /// LP tokens from Convex
    function withdraw(address to, uint256 amountLpTokens) public override onlyPCVController whenNotPaused {
        convexRewards.withdrawAndUnwrap(amountLpTokens, false);
        curvePool.transfer(to, amountLpTokens);
    }

    /// @notice claim CRV & CVX rewards earned by the LP tokens staked on this contract.
    function claimRewards() public whenNotPaused {
        convexRewards.getReward(address(this), true);
    }

    /// @notice returns the balance in USD
    function balance() public view override returns (uint256) {
        return convexRewards.balanceOf(address(this));
    }

    /// @notice returns the resistant balance in LP tokens held by the contract
    function resistantBalanceAndFei() public view override returns (uint256, uint256) {
        return (convexRewards.balanceOf(address(this)), 0);
    }
}
