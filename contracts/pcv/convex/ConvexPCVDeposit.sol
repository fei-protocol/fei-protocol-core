// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../../Constants.sol";
import "../PCVDeposit.sol";
import "./ICurveStableSwap3.sol";
import "./IConvexBooster.sol";
import "./IConvexBaseRewardPool.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title ConvexPCVDeposit: implementation for a PCVDeposit that deploys liquidity
/// on Curve, and stake the Curve LP tokens on Convex to earn rewards.
/// @author Fei Protocol
contract ConvexPCVDeposit is PCVDeposit {
    using SafeERC20 for ERC20;

    // ------------------ Properties -------------------------------------------

    uint256 public depositMaxSlippageBasisPoints;
    uint256 public constant BASIS_POINTS_GRANULARITY = 10_000;

    /// @notice The Curve pool to deposit in
    address public curvePool;
    /// @notice The Convex Booster contract (for deposit/withdraw)
    address public convexBooster;
    /// @notice The Convex Rewards contract (for claiming rewards)
    address public convexRewards;

    /// @notice number of coins in the Curve pool
    uint256 private constant N_COINS = 3;
    /// @notice boolean to know if FEI is in the pool
    bool private immutable feiInPool;
    /// @notice FEI index in the pool. If FEI is not present, value = 0.
    uint256 private immutable feiIndexInPool;

    // ------------------ Constructor ------------------------------------------

    /// @notice ConvexPCVDeposit constructor
    /// @param _core Fei Core for reference
    /// @param _curvePool The Curve pool to deposit in
    /// @param _convexBooster The Convex Booster contract (for deposit/withdraw)
    /// @param _convexRewards The Convex Rewards contract (for claiming rewards)
    /// @param _depositMaxSlippageBasisPoints max slippage for deposits, in bp
    constructor(
        address _core,
        address _curvePool,
        address _convexBooster,
        address _convexRewards,
        uint256 _depositMaxSlippageBasisPoints
    ) CoreRef(_core) {
        curvePool = _curvePool;
        convexBooster = _convexBooster;
        convexRewards = _convexRewards;
        depositMaxSlippageBasisPoints = _depositMaxSlippageBasisPoints;

        // cache some values for later gas optimizations
        address feiAddress = address(fei());
        bool foundFeiInPool = false;
        uint256 feiFoundAtIndex = 0;
        for (uint256 i = 0; i < N_COINS; i++) {
            address tokenAddress = ICurveStableSwap3(_curvePool).coins(i);
            if (tokenAddress == feiAddress) {
                foundFeiInPool = true;
                feiFoundAtIndex = i;
            }
        }
        feiInPool = foundFeiInPool;
        feiIndexInPool = feiFoundAtIndex;
    }

    /// @notice Curve/Convex deposits report their balance in USD
    function balanceReportedIn() public pure override returns(address) {
        return Constants.USD;
    }

    /// @notice deposit tokens into the Curve pool, then stake the LP tokens
    /// on Convex to earn rewards.
    function deposit() public override whenNotPaused {
        // fetch current balances
        uint256[N_COINS] memory balances;
        uint256 totalBalances = 0;
        for (uint256 i = 0; i < N_COINS; i++) {
            IERC20 token = IERC20(ICurveStableSwap3(curvePool).coins(i));
            balances[i] = token.balanceOf(address(this));
            totalBalances += balances[i];

            // approve for deposit
            if (balances[i] > 0) {
                token.approve(curvePool, balances[i]);
            }
        }

        // require non-empty deposit
        require(totalBalances > 0, "ConvexPCVDeposit: cannot deposit 0");

        // set maximum allowed slippage
        uint256 virtualPrice = ICurveStableSwap3(curvePool).get_virtual_price();
        uint256 minLpOut = totalBalances * 1e18 / virtualPrice;
        uint256 lpSlippageAccepted = minLpOut * depositMaxSlippageBasisPoints / Constants.BASIS_POINTS_GRANULARITY;
        minLpOut -= lpSlippageAccepted;

        // deposit in the Curve pool
        ICurveStableSwap3(curvePool).add_liquidity(balances, minLpOut);

        // stake LP tokens to farm on Convex
        stakeLpTokens();
    }

    /// @notice unstake LP tokens from Convex Rewards, withdraw Curve LP tokens
    /// from Convex, and exit the Curve pool by removing liquidity in one token.
    /// If FEI is in the pool, pull FEI out of the pool. If FEI is not in the pool,
    /// exit in the first token of the pool. To exit without chosing a specific
    /// token, and minimize slippage, use exitPool().
    function withdraw(address to, uint256 amountUnderlying)
        public
        override
        onlyPCVController
        whenNotPaused
    {
        withdrawOneCoin(feiIndexInPool, to, amountUnderlying);
    }

    /// @notice unstake LP tokens from Convex Rewards, withdraw Curve LP tokens
    /// from Convex, and exit the Curve pool by removing liquidity in one token.
    /// Note that this method can cause slippage. To exit without slippage, use
    /// the exitPool() method.
    function withdrawOneCoin(uint256 coinIndexInPool, address to, uint256 amountUnderlying)
        public
        onlyPCVController
        whenNotPaused
    {
        // get LP Curve LP tokens & rewards out of Convex
        IConvexBaseRewardPool(convexRewards).withdrawAllAndUnwrap(true);

        // burn all LP tokens to get one token out
        uint256 virtualPrice = ICurveStableSwap3(curvePool).get_virtual_price();
        uint256 maxLpUsed = amountUnderlying * 1e18 / virtualPrice;
        uint256 lpSlippageAccepted = maxLpUsed * depositMaxSlippageBasisPoints / Constants.BASIS_POINTS_GRANULARITY;
        maxLpUsed += lpSlippageAccepted;
        ICurveStableSwap3(curvePool).remove_liquidity_one_coin(maxLpUsed, int128(int256(coinIndexInPool)), amountUnderlying);

        // send token to destination
        IERC20(ICurveStableSwap3(curvePool).coins(coinIndexInPool)).transfer(to, amountUnderlying);

        // re-stake LP tokens on Convex
        stakeLpTokens();
    }

    /// @notice deposit Curve LP tokens on Convex and stake deposit tokens in the
    /// Convex rewards contract.
    /// Note : this call is permissionless, and can be used if LP tokens are
    /// transferred to this contract directly.
    function stakeLpTokens() public whenNotPaused {
        uint256 lpTokenBalance = ICurveStableSwap3(curvePool).balanceOf(address(this));
        uint256 poolId = IConvexBaseRewardPool(convexRewards).pid();
        ICurveStableSwap3(curvePool).approve(convexBooster, lpTokenBalance);
        IConvexBooster(convexBooster).deposit(poolId, lpTokenBalance, true);
    }

    /// @notice unstake LP tokens from Convex Rewards, withdraw Curve LP tokens
    /// from Convex, and exit the Curve pool by removing liquidity. The contract
    /// will hold tokens in proportion to what was in the Curve pool at the time
    /// of exit, i.e. if the pool is 20% FRAX 60% FEI 20% alUSD, and the contract
    /// has 10M$ of liquidity, it will exit the pool with 2M FRAX, 6M FEI, 2M alUSD.
    function exitPool() public onlyPCVController whenNotPaused {
        // get LP Curve LP tokens & rewards out of Convex
        IConvexBaseRewardPool(convexRewards).withdrawAllAndUnwrap(true);

        // burn all LP tokens to exit pool
        uint256 lpTokenBalance = ICurveStableSwap3(curvePool).balanceOf(address(this));
        uint256[N_COINS] memory minAmountsOuts;
        ICurveStableSwap3(curvePool).remove_liquidity(lpTokenBalance, minAmountsOuts);
    }

    /// @notice claim CRV & CVX rewards earned by the LP tokens staked on this contract.
    function claimRewards() public whenNotPaused {
        IConvexBaseRewardPool(convexRewards).getReward(address(this), true);
    }

    /// @notice returns the balance in USD
    function balance() public view override returns (uint256) {
        uint256 lpTokensStaked = IConvexBaseRewardPool(convexRewards).balanceOf(address(this));
        uint256 virtualPrice = ICurveStableSwap3(curvePool).get_virtual_price();
        uint256 usdBalance = lpTokensStaked * virtualPrice / 1e18;

        // if FEI is in the pool, remove the FEI part of the liquidity, e.g. if
        // FEI is filling 40% of the pool, reduce the balance by 40%.
        if (feiInPool) {
            uint256[N_COINS] memory balances;
            uint256 totalBalances = 0;
            for (uint256 i = 0; i < N_COINS; i++) {
                balances[i] = IERC20(ICurveStableSwap3(curvePool).coins(i)).balanceOf(address(curvePool));
                totalBalances += balances[i];
            }
            usdBalance -= usdBalance * balances[feiIndexInPool] / totalBalances;
        }

        return usdBalance;
    }

    /// @notice returns the resistant balance in USD and FEI held by the contract
    function resistantBalanceAndFei() public view override returns (
        uint256 resistantBalance,
        uint256 resistantFei
    ) {
        uint256 lpTokensStaked = IConvexBaseRewardPool(convexRewards).balanceOf(address(this));
        uint256 virtualPrice = ICurveStableSwap3(curvePool).get_virtual_price();
        resistantBalance = lpTokensStaked * virtualPrice / 1e18;

        // to have a resistant balance, we assume the pool is balanced, e.g. if
        // the pool holds 3 tokens, we assume FEI is 33.3% of the pool.
        if (feiInPool) {
            resistantFei = resistantBalance / N_COINS;
            resistantBalance -= resistantFei;
        }

        return (resistantBalance, resistantFei);
    }
}
