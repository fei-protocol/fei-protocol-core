// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "./IPCVDeposit.sol";
import "../refs/CoreRef.sol";
import "../external/Decimal.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IWETH.sol";

// stETH Token contract specific functions
interface ILido {
    function getTotalShares() external view returns (uint256);
    function getTotalPooledEther() external view returns (uint256);
    function sharesOf(address _account) external view returns (uint256);
    function getSharesByPooledEth(uint256 _ethAmount) external view returns (uint256);
    function getPooledEthByShares(uint256 _sharesAmount) external view returns (uint256);
    function getFee() external view returns (uint256);
    function increaseAllowance(address _spender, uint256 _addedValue) external returns (bool);
    function decreaseAllowance(address _spender, uint256 _subtractedValue) external returns (bool);
    function submit(address referral) external payable returns (uint256);
}

// Curve stETH-ETH pool
interface IStableSwapSTETH {
    function exchange(int128 i, int128 j, uint256 dx, uint256 min_dy) external payable returns (uint256);
    function get_dy(int128 i, int128 j, uint256 dx) external view returns (uint256);
    function coins(uint256 arg0) external view returns (address);
}

/// @title implementation for PCV Deposit that can take ETH and get stETH either
/// by staking on Lido or swapping on Curve, and sell back stETH for ETH on Curve.
/// @author eswak, realisation
contract EthLidoPCVDeposit is IPCVDeposit, CoreRef {
    using SafeERC20 for ERC20;
    using Decimal for Decimal.D256;

    // ----------- Events ---------------
    event UpdateMaximumSlippage(uint256 maximumSlippageBasisPoints);

    // ----------- Properties -----------
    // References to external contracts
    address public immutable steth;
    address public immutable weth;
    address public immutable stableswap;

    // Maximum tolerated slippage
    uint256 public maximumSlippageBasisPoints;
    uint256 public constant BASIS_POINTS_GRANULARITY = 10_000;

    constructor(
        address _core,
        address _steth,
        address _weth,
        address _stableswap,
        uint256 _maximumSlippageBasisPoints
    ) CoreRef(_core) {
        steth = _steth;
        weth = _weth;
        stableswap = _stableswap;
        maximumSlippageBasisPoints = _maximumSlippageBasisPoints;

        // Infinite allowance to trade stETH on the Curve pool
        IERC20(_steth).approve(_stableswap, type(uint256).max);
    }

    // Empty callback on ETH reception
    receive() external payable {}

    // =======================================================================
    // WETH management
    // =======================================================================

    /// @notice Wraps all ETH held by the contract to WETH
    /// Anyone can call it
    function wrapETH() public {
        IWETH(weth).deposit{value: address(this).balance}();
    }

    // =======================================================================
    // IPCVDeposit interface override
    // =======================================================================
    /// @notice deposit WETH held by the contract to get stETH.
    /// @dev everyone can call deposit(), it is not protected by PCVController
    /// rights, because all ETH and WETH held by the contract is destined to be
    /// changed to stETH anyway.
    function deposit() external override whenNotPaused {
        // Unwrap WETH
        uint256 amountIn = IERC20(weth).balanceOf(address(this));
        IWETH(weth).withdraw(amountIn);

        // Get the expected amount of stETH out of a Curve trade
        // (single trade with all the held ETH)
        address _tokenOne = IStableSwapSTETH(stableswap).coins(0);
        uint256 expectedAmountOut = IStableSwapSTETH(stableswap).get_dy(
            _tokenOne == steth ? int128(1) : int128(0),
            _tokenOne == steth ? int128(0) : int128(1),
            amountIn
        );

        // If we get more stETH out than ETH in by swapping on Curve,
        // get the stETH by doing a Curve swap.
        uint256 actualAmountOut;
        if (expectedAmountOut > amountIn) {
          uint256 minimumAmountOut = amountIn;
          actualAmountOut = IStableSwapSTETH(stableswap).exchange{value: amountIn}(
              _tokenOne == steth ? int128(1) : int128(0),
              _tokenOne == steth ? int128(0) : int128(1),
              amountIn,
              minimumAmountOut
          );
        }
        // Otherwise, stake ETH for stETH directly on the Lido contract
        // to get a 1:1 trade.
        else {
            ILido(steth).submit{value: amountIn}(address(0));
            actualAmountOut = amountIn;
        }

        emit Deposit(msg.sender, actualAmountOut);
    }

    /// @notice withdraw stETH held by the contract to get WETH.
    /// This function with swap stETH held by the contract to ETH, then wrap
    /// it to WETH, and transfer it to the target address. Note: the withdraw could
    /// revert if the Curve pool is imbalanced with too many stETH and the amount
    /// of WETH out of the trade is less than the tolerated slippage.
    /// @param to the destination of the withdrawn WETH tokens
    /// @param amountIn the number of stETH to withdraw.
    function withdraw(address to, uint256 amountIn) external override onlyPCVController whenNotPaused {
        require(balance() >= amountIn, "EthLidoPCVDeposit: not enough stETH.");

        // Compute the minimum accepted amount of ETH out of the trade, based
        // on the slippage settings.
        Decimal.D256 memory maxSlippage = Decimal.ratio(BASIS_POINTS_GRANULARITY - maximumSlippageBasisPoints, BASIS_POINTS_GRANULARITY);
        uint256 minimumAcceptedAmountOut = maxSlippage.mul(amountIn).asUint256();

        // Swap stETH for ETH on the Curve pool
        address _tokenOne = IStableSwapSTETH(stableswap).coins(0);
        uint256 actualAmountOut = IStableSwapSTETH(stableswap).exchange(
            _tokenOne == steth ? int128(1) : int128(0),
            _tokenOne == steth ? int128(0) : int128(1),
            amountIn,
            minimumAcceptedAmountOut
        );

        // Wrap ouput ETH to WETH and transfer it to destination.
        IWETH(weth).deposit{value: actualAmountOut}();
        ERC20(weth).safeTransfer(to, actualAmountOut);

        emit Withdrawal(msg.sender, to, actualAmountOut);
    }

    /// @notice withdraw ERC20 from the contract
    /// @param token address of the ERC20 to send
    /// @param to address destination of the ERC20
    /// @param amount quantity of ERC20 to send
    function withdrawERC20(
      address token,
      address to,
      uint256 amount
    ) public override onlyPCVController {
        ERC20(token).safeTransfer(to, amount);
        emit WithdrawERC20(msg.sender, token, to, amount);
    }

    /// @notice Returns the current balance of stETH held by the contract
    function balance() public view override returns (uint256 amount) {
        return IERC20(steth).balanceOf(address(this));
    }

    // =======================================================================
    // Functions specific to EthLidoPCVDeposit
    // =======================================================================
    /// @notice Sets the maximum slippage vs 1:1 price accepted during withdraw.
    /// @param _maximumSlippageBasisPoints the maximum slippage expressed in basis points (1/10_000)
    function setMaximumSlippage(uint256 _maximumSlippageBasisPoints) external onlyGovernor {
        require(_maximumSlippageBasisPoints <= BASIS_POINTS_GRANULARITY, "EthLidoPCVDeposit: Exceeds bp granularity.");
        maximumSlippageBasisPoints = _maximumSlippageBasisPoints;
        emit UpdateMaximumSlippage(_maximumSlippageBasisPoints);
    }
}
