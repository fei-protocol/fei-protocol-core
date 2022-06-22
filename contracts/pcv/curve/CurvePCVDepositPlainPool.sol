// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../../Constants.sol";
import "../PCVDeposit.sol";
import "./ICurveStableSwap3.sol";

/// @title CurvePCVDepositPlainPool: implementation for a PCVDeposit that deploys
/// liquidity on Curve, in a plain pool (3 stable assets).
/// @author Fei Protocol
contract CurvePCVDepositPlainPool is PCVDeposit {
    // ------------------ Properties -------------------------------------------

    /// @notice maximum slippage accepted during deposit / withdraw, expressed
    /// in basis points (100% = 10_000).
    uint256 public maxSlippageBasisPoints;

    /// @notice The Curve pool to deposit in
    ICurveStableSwap3 public curvePool;

    /// @notice number of coins in the Curve pool
    uint256 private constant N_COINS = 3;
    /// @notice boolean to know if FEI is in the pool
    bool private immutable feiInPool;
    /// @notice FEI index in the pool. If FEI is not present, value = 0.
    uint256 private immutable feiIndexInPool;

    // ------------------ Constructor ------------------------------------------

    /// @notice CurvePCVDepositPlainPool constructor
    /// @param _core Fei Core for reference
    /// @param _curvePool The Curve pool to deposit in
    /// @param _maxSlippageBasisPoints max slippage for deposits, in bp
    constructor(
        address _core,
        address _curvePool,
        uint256 _maxSlippageBasisPoints
    ) CoreRef(_core) {
        curvePool = ICurveStableSwap3(_curvePool);
        maxSlippageBasisPoints = _maxSlippageBasisPoints;

        // cache some values for later gas optimizations
        address feiAddress = address(fei());
        bool foundFeiInPool = false;
        uint256 feiFoundAtIndex = 0;
        for (uint256 i = 0; i < N_COINS; i++) {
            address tokenAddress = ICurvePool(_curvePool).coins(i);
            if (tokenAddress == feiAddress) {
                foundFeiInPool = true;
                feiFoundAtIndex = i;
            }
        }
        feiInPool = foundFeiInPool;
        feiIndexInPool = feiFoundAtIndex;
    }

    /// @notice Curve/Convex deposits report their balance in USD
    function balanceReportedIn() public pure override returns (address) {
        return Constants.USD;
    }

    /// @notice deposit tokens into the Curve pool, then stake the LP tokens
    /// on Convex to earn rewards.
    function deposit() public override whenNotPaused {
        // fetch current balances
        uint256[N_COINS] memory balances;
        IERC20[N_COINS] memory tokens;
        uint256 totalBalances = 0;
        for (uint256 i = 0; i < N_COINS; i++) {
            tokens[i] = IERC20(curvePool.coins(i));
            balances[i] = tokens[i].balanceOf(address(this));
            totalBalances += balances[i];
        }

        // require non-empty deposit
        require(totalBalances > 0, "CurvePCVDepositPlainPool: cannot deposit 0");

        // set maximum allowed slippage
        uint256 virtualPrice = curvePool.get_virtual_price();
        uint256 minLpOut = (totalBalances * 1e18) / virtualPrice;
        uint256 lpSlippageAccepted = (minLpOut * maxSlippageBasisPoints) / Constants.BASIS_POINTS_GRANULARITY;
        minLpOut -= lpSlippageAccepted;

        // approval
        for (uint256 i = 0; i < N_COINS; i++) {
            // approve for deposit
            if (balances[i] > 0) {
                tokens[i].approve(address(curvePool), balances[i]);
            }
        }

        // deposit in the Curve pool
        curvePool.add_liquidity(balances, minLpOut);
    }

    /// @notice Exit the Curve pool by removing liquidity in one token.
    /// If FEI is in the pool, pull FEI out of the pool. If FEI is not in the pool,
    /// exit in the first token of the pool. To exit without chosing a specific
    /// token, and minimize slippage, use exitPool().
    function withdraw(address to, uint256 amountUnderlying) public override onlyPCVController whenNotPaused {
        withdrawOneCoin(feiIndexInPool, to, amountUnderlying);
    }

    /// @notice Exit the Curve pool by removing liquidity in one token.
    /// Note that this method can cause slippage. To exit without slippage, use
    /// the exitPool() method.
    function withdrawOneCoin(
        uint256 coinIndexInPool,
        address to,
        uint256 amountUnderlying
    ) public onlyPCVController whenNotPaused {
        // burn LP tokens to get one token out
        uint256 virtualPrice = curvePool.get_virtual_price();
        uint256 maxLpUsed = (amountUnderlying * 1e18) / virtualPrice;
        uint256 lpSlippageAccepted = (maxLpUsed * maxSlippageBasisPoints) / Constants.BASIS_POINTS_GRANULARITY;
        maxLpUsed += lpSlippageAccepted;
        curvePool.remove_liquidity_one_coin(maxLpUsed, int128(int256(coinIndexInPool)), amountUnderlying);

        // send token to destination
        IERC20(curvePool.coins(coinIndexInPool)).transfer(to, amountUnderlying);
    }

    /// @notice Exit the Curve pool by removing liquidity. The contract
    /// will hold tokens in proportion to what was in the Curve pool at the time
    /// of exit, i.e. if the pool is 20% FRAX 60% FEI 20% alUSD, and the contract
    /// has 10M$ of liquidity, it will exit the pool with 2M FRAX, 6M FEI, 2M alUSD.
    function exitPool() public onlyPCVController whenNotPaused {
        // burn all LP tokens to exit pool
        uint256 lpTokenBalance = curvePool.balanceOf(address(this));
        uint256[N_COINS] memory minAmountsOuts;
        curvePool.remove_liquidity(lpTokenBalance, minAmountsOuts);
    }

    /// @notice returns the balance in USD
    function balance() public view override returns (uint256) {
        uint256 lpTokens = curvePool.balanceOf(address(this));
        uint256 virtualPrice = curvePool.get_virtual_price();
        uint256 usdBalance = (lpTokens * virtualPrice) / 1e18;

        // if FEI is in the pool, remove the FEI part of the liquidity, e.g. if
        // FEI is filling 40% of the pool, reduce the balance by 40%.
        if (feiInPool) {
            uint256[N_COINS] memory balances;
            uint256 totalBalances = 0;
            for (uint256 i = 0; i < N_COINS; i++) {
                IERC20 poolToken = IERC20(curvePool.coins(i));
                balances[i] = poolToken.balanceOf(address(curvePool));
                totalBalances += balances[i];
            }
            usdBalance -= (usdBalance * balances[feiIndexInPool]) / totalBalances;
        }

        return usdBalance;
    }

    /// @notice returns the resistant balance in USD and FEI held by the contract
    function resistantBalanceAndFei() public view override returns (uint256 resistantBalance, uint256 resistantFei) {
        uint256 lpTokens = curvePool.balanceOf(address(this));
        uint256 virtualPrice = curvePool.get_virtual_price();
        resistantBalance = (lpTokens * virtualPrice) / 1e18;

        // to have a resistant balance, we assume the pool is balanced, e.g. if
        // the pool holds 3 tokens, we assume FEI is 33.3% of the pool.
        if (feiInPool) {
            resistantFei = resistantBalance / N_COINS;
            resistantBalance -= resistantFei;
        }

        return (resistantBalance, resistantFei);
    }
}
