// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;
pragma experimental ABIEncoderV2;

import "../PCVDeposit.sol";
import "../../Constants.sol";
import "../../refs/CoreRef.sol";
import "../../external/Decimal.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// stETH Token contract specific functions
interface ILido {
    function getTotalShares() external view returns (uint256);

    function getTotalPooledEther() external view returns (uint256);

    function sharesOf(address _account) external view returns (uint256);

    function getSharesByPooledEth(uint256 _ethAmount)
        external
        view
        returns (uint256);

    function getPooledEthByShares(uint256 _sharesAmount)
        external
        view
        returns (uint256);

    function getFee() external view returns (uint256);

    function increaseAllowance(address _spender, uint256 _addedValue)
        external
        returns (bool);

    function decreaseAllowance(address _spender, uint256 _subtractedValue)
        external
        returns (bool);

    function submit(address referral) external payable returns (uint256);
}

// Curve stETH-ETH pool
interface IStableSwapSTETH {
    function exchange(
        int128 i,
        int128 j,
        uint256 dx,
        uint256 min_dy
    ) external payable returns (uint256);

    function get_dy(
        int128 i,
        int128 j,
        uint256 dx
    ) external view returns (uint256);

    function coins(uint256 arg0) external view returns (address);
}

/// @title implementation for PCV Deposit that can take ETH and get stETH either
/// by staking on Lido or swapping on Curve, and sell back stETH for ETH on Curve.
/// @author eswak, realisation
contract EthLidoPCVDeposit is PCVDeposit {
    using SafeERC20 for ERC20;
    using Decimal for Decimal.D256;

    // ----------- Events ---------------
    event UpdateMaximumSlippage(uint256 maximumSlippageBasisPoints);

    // ----------- Properties -----------
    // References to external contracts
    address public immutable steth;
    address public immutable stableswap;

    // Maximum tolerated slippage
    uint256 public maximumSlippageBasisPoints;

    constructor(
        address _core,
        address _steth,
        address _stableswap,
        uint256 _maximumSlippageBasisPoints
    ) CoreRef(_core) {
        steth = _steth;
        stableswap = _stableswap;
        maximumSlippageBasisPoints = _maximumSlippageBasisPoints;
    }

    // Empty callback on ETH reception
    receive() external payable {}

    // =======================================================================
    // IPCVDeposit interface override
    // =======================================================================
    /// @notice deposit ETH held by the contract to get stETH.
    /// @dev everyone can call deposit(), it is not protected by PCVController
    /// rights, because all ETH held by the contract is destined to be
    /// changed to stETH anyway.
    function deposit() external override whenNotPaused {
        uint256 amountIn = address(this).balance;
        require(amountIn > 0, "EthLidoPCVDeposit: cannot deposit 0.");

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
        uint256 balanceBefore = IERC20(steth).balanceOf(address(this));
        if (expectedAmountOut > amountIn) {
            uint256 minimumAmountOut = amountIn;

            // Allowance to trade stETH on the Curve pool
            IERC20(steth).approve(stableswap, amountIn);

            // Perform swap
            actualAmountOut = IStableSwapSTETH(stableswap).exchange{
                value: amountIn
            }(
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

        // Check the received amount
        uint256 balanceAfter = IERC20(steth).balanceOf(address(this));
        uint256 amountReceived = balanceAfter - balanceBefore;
        // @dev: check is not made on "actualAmountOut" directly, because sometimes
        // there are float rounding error, and we get a few wei less. Additionally,
        // the stableswap could return the uint256 amountOut but never transfer tokens.
        Decimal.D256 memory maxSlippage = Decimal.ratio(
            Constants.BASIS_POINTS_GRANULARITY - maximumSlippageBasisPoints,
            Constants.BASIS_POINTS_GRANULARITY
        );
        uint256 minimumAcceptedAmountOut = maxSlippage
            .mul(amountIn)
            .asUint256();
        require(
            amountReceived >= minimumAcceptedAmountOut,
            "EthLidoPCVDeposit: not enough stETH received."
        );

        emit Deposit(msg.sender, actualAmountOut);
    }

    /// @notice withdraw stETH held by the contract to get ETH.
    /// This function with swap stETH held by the contract to ETH, and transfer
    /// it to the target address. Note: the withdraw could
    /// revert if the Curve pool is imbalanced with too many stETH and the amount
    /// of ETH out of the trade is less than the tolerated slippage.
    /// @param to the destination of the withdrawn ETH
    /// @param amountIn the number of stETH to withdraw.
    function withdraw(address to, uint256 amountIn)
        external
        override
        onlyPCVController
        whenNotPaused
    {
        require(balance() >= amountIn, "EthLidoPCVDeposit: not enough stETH.");

        // Compute the minimum accepted amount of ETH out of the trade, based
        // on the slippage settings.
        Decimal.D256 memory maxSlippage = Decimal.ratio(
            Constants.BASIS_POINTS_GRANULARITY - maximumSlippageBasisPoints,
            Constants.BASIS_POINTS_GRANULARITY
        );
        uint256 minimumAcceptedAmountOut = maxSlippage
            .mul(amountIn)
            .asUint256();

        // Swap stETH for ETH on the Curve pool
        uint256 balanceBefore = address(this).balance;
        address _tokenOne = IStableSwapSTETH(stableswap).coins(0);
        IERC20(steth).approve(stableswap, amountIn);
        uint256 actualAmountOut = IStableSwapSTETH(stableswap).exchange(
            _tokenOne == steth ? int128(0) : int128(1),
            _tokenOne == steth ? int128(1) : int128(0),
            amountIn,
            0 // minimum accepted amount out
        );

        // Check that we received enough stETH as an output of the trade
        // This is enforced in this contract, after knowing the output of the trade,
        // instead of the StableSwap pool's min_dy check.
        require(
            actualAmountOut >= minimumAcceptedAmountOut,
            "EthLidoPCVDeposit: slippage too high."
        );

        // Check the received amount
        uint256 balanceAfter = address(this).balance;
        uint256 amountReceived = balanceAfter - balanceBefore;
        require(
            amountReceived >= minimumAcceptedAmountOut,
            "EthLidoPCVDeposit: not enough ETH received."
        );

        // Transfer ETH to destination.
        Address.sendValue(payable(to), actualAmountOut);

        emit Withdrawal(msg.sender, to, actualAmountOut);
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
    function setMaximumSlippage(uint256 _maximumSlippageBasisPoints)
        external
        onlyGovernorOrAdmin
    {
        require(
            _maximumSlippageBasisPoints <= Constants.BASIS_POINTS_GRANULARITY,
            "EthLidoPCVDeposit: Exceeds bp granularity."
        );
        maximumSlippageBasisPoints = _maximumSlippageBasisPoints;
        emit UpdateMaximumSlippage(_maximumSlippageBasisPoints);
    }

    /// @notice display the related token of the balance reported
    function balanceReportedIn() public pure override returns (address) {
        return address(Constants.WETH);
    }
}
