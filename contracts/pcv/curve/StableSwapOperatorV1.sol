// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../PCVDeposit.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Curve metapool
interface IStableSwap {
    function coins(uint256 arg0) external view returns (address);
    function balances(uint256 arg0) external view returns (uint256);
    function add_liquidity(uint256[2] memory amounts, uint256 min_mint_amount) external;
    function remove_liquidity(uint256 _amount, uint256[2] memory min_amounts) external;
    function remove_liquidity_one_coin(uint256 _token_amount, int128 i, uint256 min_amount) external;
    function get_virtual_price() external view returns (uint256);
    function calc_withdraw_one_coin(uint256 _token_amount, int128 i) external view returns (uint256);
}
interface I3Pool {
    function add_liquidity(uint256[3] memory amounts, uint256 min_mint_amount) external;
}

/// @title StableSwapOperator: implementation for a Curve Metapool market-maker.
/// This is version 1, it only allows simple deposits and does not require the
/// Minter role. FEI has to be minted on this contract before calling deposit().
/// There are no reweight mechanisms.
/// All accounting and withdrawals are denominated in DAI. Should the contract
/// hold USDC or USDT, these can also be deposited.
/// @author eswak
contract StableSwapOperatorV1 is PCVDeposit {
    using SafeERC20 for ERC20;

    // ------------------ Properties -------------------------------------------

    uint256 public depositMaxSlippageBasisPoints;
    uint256 public constant BASIS_POINTS_GRANULARITY = 10_000;

    /// @notice The StableSwap pool to deposit in
    address public pool;

    // ------------------ Private properties -----------------------------------

    /// some fixed variables to interact with the pool
    uint8 private immutable _feiIndex; // index of FEI in the pool (0 or 1)
    uint8 private immutable _3crvIndex; // index of 3crv in the pool (0 or 1)
    address private immutable _3crv; // address of the 3crv token
    address private immutable _3pool; // address of the 3pool
    address private immutable _dai; // address of the DAI token
    address private immutable _usdc; // address of the USDC token
    address private immutable _usdt; // address of the USDT token

    // ------------------ Constructor ------------------------------------------

    /// @notice Curve PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _pool StableSwap to deposit to
    /// @param _curve3pool the Curve 3pool
    /// @param _depositMaxSlippageBasisPoints max slippage for deposits, in bp
    constructor(
        address _core,
        address _pool,
        address _curve3pool,
        uint256 _depositMaxSlippageBasisPoints
    ) CoreRef(_core) {
        // public variables
        pool = _pool;
        depositMaxSlippageBasisPoints = _depositMaxSlippageBasisPoints;

        // cached private variables
        uint8 _3crvIndexTmp = IStableSwap(pool).coins(0) == address(fei()) ? 1 : 0;
        _3crvIndex = _3crvIndexTmp;
        _feiIndex = _3crvIndexTmp == 0 ? 1 : 0;
        _3crv = IStableSwap(pool).coins(_3crvIndexTmp);
        _3pool = _curve3pool;
        _dai = IStableSwap(_curve3pool).coins(0);
        _usdc = IStableSwap(_curve3pool).coins(1);
        _usdt = IStableSwap(_curve3pool).coins(2);
    }

    /// @notice deposit DAI, USDC, USDT, 3crv, and FEI into the pool.
    /// Note: the FEI has to be minted & deposited on this contract in a previous
    ///       tx, as this contract does not use the Minter role.
    function deposit() public override onlyPCVController whenNotPaused {
        IFei _fei = fei();
        uint256 _3crvVirtualPrice = IStableSwap(_3pool).get_virtual_price();

        // Deposit DAI, USDC, and USDT, to get 3crv
        uint256 _daiBalance = IERC20(_dai).balanceOf(address(this));
        uint256 _usdcBalance = IERC20(_usdc).balanceOf(address(this));
        uint256 _usdtBalance = IERC20(_usdt).balanceOf(address(this));
        uint256 _3crvBalanceBefore = IERC20(_3crv).balanceOf(address(this));
        if (_daiBalance != 0 || _usdcBalance != 0 || _usdtBalance != 0) {
            uint256[3] memory _add3poolLiquidityAmounts;
            _add3poolLiquidityAmounts[0] = _daiBalance;
            _add3poolLiquidityAmounts[1] = _usdcBalance;
            _add3poolLiquidityAmounts[2] = _usdtBalance;
            SafeERC20.safeApprove(IERC20(_dai), _3pool, _daiBalance);
            SafeERC20.safeApprove(IERC20(_usdc), _3pool, _usdcBalance);
            SafeERC20.safeApprove(IERC20(_usdt), _3pool, _usdtBalance);
            I3Pool(_3pool).add_liquidity(
              _add3poolLiquidityAmounts,
              0 // minimum 0 3crv lp tokens out (defensively checked below)
            );
        }

        // get the number of 3crv held by the contract, and also
        // check for slippage during the 3pool deposit
        uint256 _3crvBalanceAfter = IERC20(_3crv).balanceOf(address(this));
        uint256 _3crvBalanceFromDeposit = _3crvBalanceAfter - _3crvBalanceBefore;
        uint256 _min3crvOut = (_daiBalance + _usdcBalance + _usdtBalance) * 1e18 / _3crvVirtualPrice * (BASIS_POINTS_GRANULARITY - depositMaxSlippageBasisPoints) / BASIS_POINTS_GRANULARITY;
        require(_3crvBalanceFromDeposit >= _min3crvOut, "StableSwapOperatorV1: 3pool deposit slippage too high");

        // get the amount of tokens in the pool
        (uint256 _3crvAmount, uint256 _feiAmount) = (
            IStableSwap(pool).balances(_3crvIndex),
            IStableSwap(pool).balances(_feiIndex)
        );
        // ... and the expected amount of 3crv in it after deposit
        uint256 _3crvAmountAfter = _3crvAmount + _3crvBalanceAfter;

        // get the usd value of 3crv in the pool
        uint256 _3crvUsdValue = _3crvAmountAfter * _3crvVirtualPrice / 1e18;

        // compute the number of FEI to deposit
        uint256 _feiToDeposit = 0;
        if (_3crvUsdValue > _feiAmount) {
            _feiToDeposit = _3crvUsdValue - _feiAmount;
        }

        // deposit
        if (_3crvBalanceAfter > 0 || _feiToDeposit > 0) {
            // build parameters
            uint256[2] memory _addLiquidityAmounts;
            _addLiquidityAmounts[_feiIndex] = _feiToDeposit;
            _addLiquidityAmounts[_3crvIndex] = _3crvBalanceAfter;

            // approvals
            IERC20(address(_fei)).approve(pool, _feiToDeposit);
            // 3crv needs to reset allowance to 0, see CurveTokenV1.vy#L117 :
            // assert _value == 0 or self.allowances[msg.sender][_spender] == 0
            IERC20(_3crv).approve(pool, 0);
            IERC20(_3crv).approve(pool, _3crvBalanceAfter);

            // do deposit
            uint256 _balanceBefore = IERC20(pool).balanceOf(address(this));
            IStableSwap(pool).add_liquidity(_addLiquidityAmounts, 0);
            uint256 _balanceAfter = IERC20(pool).balanceOf(address(this));

            // compute DAI out if we wanted to withdraw liquidity using our
            // new LP tokens, and withdraw fully in DAI.
            uint256 _lpTotalSupply = IERC20(pool).totalSupply();
            uint256 _3crvOut = (_3crvAmountAfter * (_balanceAfter - _balanceBefore)) / _lpTotalSupply;
            uint256 _daiOut = IStableSwap(_3pool).calc_withdraw_one_coin(
              _3crvOut, // LP tokens just deposited
              0 // 3pool coin 0 = DAI
            );

            // emit event
            emit Deposit(msg.sender, _daiOut);
        }
    }

    /// @notice withdraw DAI from the deposit. This will remove liquidity in the
    /// current pool's proportion, burn the FEI part of it, and then use the 3crv
    /// to withdraw liquidity of the 3pool in DAI.
    /// note: because of slippage & fees on withdraw, the amount of DAI out is
    ///        not exactly the expected amountUnderlying provided as input.
    /// @param amountUnderlying of tokens withdrawn
    /// @param to the address to send PCV to (self = no transfer)
    function withdraw(address to, uint256 amountUnderlying)
        public
        override
        onlyPCVController
        whenNotPaused
    {
        require(amountUnderlying != 0, "StableSwapOperatorV1: Cannot withdraw 0");

        // remove liquidity from the metapool
        uint256 _3crvVirtualPrice = IStableSwap(_3pool).get_virtual_price();
        uint256 _amount3crvToWithdraw = amountUnderlying * 1e18 / _3crvVirtualPrice;
        uint256 _lpTotalSupply = IERC20(pool).totalSupply();
        uint256 _lpToWithdraw = _lpTotalSupply * _amount3crvToWithdraw / IStableSwap(pool).balances(_3crvIndex);

        uint256[2] memory _minAmounts; // [0, 0]
        IERC20(pool).approve(pool, _lpToWithdraw);
        IStableSwap(pool).remove_liquidity(_lpToWithdraw, _minAmounts);

        // remove 3pool liquidity in DAI (3crv -> DAI)
        uint256 _3crvBalance = IERC20(_3crv).balanceOf(address(this));
        uint256 _daiBalanceBefore = IERC20(_dai).balanceOf(address(this));
        IERC20(_3pool).approve(_3pool, _3crvBalance);
        IStableSwap(_3pool).remove_liquidity_one_coin(
          _3crvBalance,
          0, // 0 = DAI token index
          0 // minimum 0 DAI out (defensively checked below)
        );

        // check slippage
        uint256 _daiBalanceAfter = IERC20(_dai).balanceOf(address(this));
        uint256 _minDaiOut = amountUnderlying * (BASIS_POINTS_GRANULARITY - depositMaxSlippageBasisPoints) / BASIS_POINTS_GRANULARITY;
        uint256 _daiBalanceWithdrawn = _daiBalanceAfter - _daiBalanceBefore;
        require(_daiBalanceWithdrawn >= _minDaiOut, "StableSwapOperatorV1: 3pool withdraw slippage too high");

        // compute amount to withdraw
        uint256 _amount = amountUnderlying;
        // @dev: there is a small slippage on remove, so the amount of DAI balance
        //       will be slightly smaller than the amountUnderlying if the contract
        //       held no DAI before withdraw.
        if (_amount == 0 || _daiBalanceAfter < _amount) { // 0 = withdraw all
            _amount = _daiBalanceAfter;
        }

        // if not withdrawing to self, transfer DAI
        if (to != address(this)) {
            SafeERC20.safeTransfer(IERC20(_dai), to, _amount);
        }

        // emit event
        emit Withdrawal(msg.sender, to, _amount);
    }

    /// @notice returns the DAI balance of PCV in the Deposit, if it were to
    /// perform the following steps :
    /// - remove liquidity with all its LP tokens.
    /// - burn the FEI, keep only the 3crv.
    /// - Redeem the 3crv part of its LP + eventual 3crv held on the contract
    ///   to DAI on the 3pool.
    /// Note: there is a rounding error compared to what would happend with an
    /// actual call to remove_liquidity_one_coin().
    function balance() public view override returns (uint256) {
        uint256 _3crvBalance = IERC20(_3crv).balanceOf(address(this));

        // get the number of LP tokens
        uint256 _lpBalance = IERC20(pool).balanceOf(address(this));
        uint256 _lpTotalSupply = IERC20(pool).totalSupply();

        // get the share of 3crv in the pool
        uint256 _3crvShare = IStableSwap(pool).balances(_3crvIndex) * _lpBalance / _lpTotalSupply;
        uint256 _total3crv = _3crvShare + _3crvBalance;

        uint256 _daiOut = 0;
        if (_total3crv != 0) {
          _daiOut = IStableSwap(_3pool).calc_withdraw_one_coin(
            _total3crv, // total 3pool LP tokens held in this contract
            0 // 3pool coin 0 = DAI
          );
        }

        return _daiOut;
    }
}
