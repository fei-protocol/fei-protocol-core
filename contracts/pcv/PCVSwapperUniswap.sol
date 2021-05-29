// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./IPCVSwapper.sol";
import "../refs/OracleRef.sol";
import "../utils/Timed.sol";
import "../external/UniswapV2Library.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IWETH.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";

/// @title implementation for PCV Swapper that swaps ERC20 tokens on Uniswap
/// @author eswak
contract PCVSwapperUniswap is IPCVSwapper, OracleRef, Timed {
    using SafeERC20 for ERC20;
    using Decimal for Decimal.D256;

    /// @notice the token to spend on swap (outbound)
    address public immutable override tokenSpent;
    /// @notice the token to receive on swap (inbound)
    address public immutable override tokenReceived;
    /// @notice the address that will receive the inbound tokens
    address public override tokenReceivingAddress;
    /// @notice the maximum amount of tokens to spend on every swap
    uint256 public maxSpentPerSwap;
    /// @notice should we use (1 / oraclePrice) instead of oraclePrice ?
    bool public invertOraclePrice;
    /// @notice the incentive for calling swap() function, in FEI
    uint256 public immutable swapIncentiveAmount;
    /// @notice the maximum amount of slippage vs oracle price
    uint256 public maximumSlippageBasisPoints;
    uint256 public constant BASIS_POINTS_GRANULARITY = 10_000;

    /// @notice Uniswap pair to swap on
    IUniswapV2Pair public immutable pair;

    // solhint-disable-next-line var-name-mixedcase
    IWETH public immutable WETH;

    constructor(
        address _core,
        IUniswapV2Pair _pair,
        // solhint-disable-next-line var-name-mixedcase
        IWETH _WETH,
        address _oracle,
        uint256 _swapFrequency,
        address _tokenSpent,
        address _tokenReceived,
        address _tokenReceivingAddress,
        uint256 _maxSpentPerSwap,
        uint256 _maximumSlippageBasisPoints,
        bool _invertOraclePrice,
        uint256 _swapIncentiveAmount
    ) OracleRef(_core, _oracle) Timed(_swapFrequency) {
        pair = _pair;
        WETH = _WETH;
        tokenSpent = _tokenSpent;
        tokenReceived = _tokenReceived;
        tokenReceivingAddress = _tokenReceivingAddress;
        maxSpentPerSwap = _maxSpentPerSwap;
        maximumSlippageBasisPoints = _maximumSlippageBasisPoints;
        invertOraclePrice = _invertOraclePrice;
        swapIncentiveAmount = _swapIncentiveAmount;

        // start timer
        _initTimed();
    }

    /// @notice All received ETH is wrapped to WETH
    receive() external payable {
      if (msg.sender != address(WETH)) {
        WETH.deposit{value: msg.value}();
      }
    }

    // =======================================================================
    // IPCVSwapper interface override
    // =======================================================================

    /// @notice withdraw ETH from the contract
    /// @param to address to send ETH
    /// @param amountOut amount of ETH to send
    function withdrawETH(address payable to, uint256 amountOut) external override onlyPCVController {
        WETH.withdraw(amountOut);
        Address.sendValue(to, amountOut);
        emit WithdrawETH(msg.sender, to, amountOut);
    }

    /// @notice withdraw ERC20 from the contract
    /// @param to address destination of the ERC20
    /// @param token address of the ERC20 to send
    /// @param amount quantity of ERC20 to send
    function withdrawERC20(address to, address token, uint256 amount) external override onlyPCVController {
        ERC20(token).safeTransfer(to, amount);
        emit WithdrawERC20(msg.sender, to, token, amount);
    }

    /// @notice Sets the address receiving swap's inbound tokens
    /// @param _tokenReceivingAddress the address that will receive tokens
    function setReceivingAddress(address _tokenReceivingAddress) external override onlyGovernor {
      tokenReceivingAddress = _tokenReceivingAddress;
      emit UpdateReceivingAddress(_tokenReceivingAddress);
    }

    // =======================================================================
    // Setters
    // =======================================================================

    /// @notice Sets the maximum slippage vs Oracle price accepted during swaps
    /// @param _maximumSlippageBasisPoints the maximum slippage expressed in basis points (1/10_000)
    function setMaximumSlippage(uint256 _maximumSlippageBasisPoints) external onlyGovernor {
        require(_maximumSlippageBasisPoints <= BASIS_POINTS_GRANULARITY, "PCVSwapperUniswap: Exceeds bp granularity.");
        maximumSlippageBasisPoints = _maximumSlippageBasisPoints;
    }

    /// @notice Sets the maximum tokens spent on each swap
    /// @param _maxSpentPerSwap the maximum number of tokens to be swapped on each call
    function setMaxSpentPerSwap(uint256 _maxSpentPerSwap) external onlyGovernor {
        require(_maxSpentPerSwap != 0, "PCVSwapperUniswap: Cannot swap 0.");
        maxSpentPerSwap = _maxSpentPerSwap;
    }

    /// @notice sets the minimum time between swaps
    function setSwapFrequency(uint256 _duration) external onlyGovernor {
       _setDuration(_duration);
    }

    /// @notice sets invertOraclePrice : use (1 / oraclePrice) if true
    function setInvertOraclePrice(bool _invertOraclePrice) external onlyGovernor {
        invertOraclePrice = _invertOraclePrice;
    }

    // =======================================================================
    // External functions
    // =======================================================================

    /// @notice Swap tokenSpent for tokenReceived
    function swap() external override afterTime whenNotPaused {
      updateOracle();

      uint256 amountIn = _getExpectedAmountIn();
      uint256 amountOut = _getExpectedAmountOut(amountIn);
      uint256 minimumAcceptableAmountOut = _getMinimumAcceptableAmountOut(amountIn);

      // Check spot price vs oracle price discounted by max slippage
      // E.g. for a max slippage of 3%, spot price must be >= 97% oraclePrice
      require(minimumAcceptableAmountOut <= amountOut, "PCVSwapperUniswap: slippage too high.");

      // Reset timer
      _initTimed();

      // Perform swap
      ERC20(tokenSpent).safeTransfer(address(pair), amountIn);
      (uint256 amount0Out, uint256 amount1Out) =
          pair.token0() == address(tokenSpent)
              ? (uint256(0), amountOut)
              : (amountOut, uint256(0));
      pair.swap(amount0Out, amount1Out, tokenReceivingAddress, new bytes(0));

      // Emit event
      emit Swap(
        msg.sender,
        tokenSpent,
        tokenReceived,
        amountIn,
        amountOut
      );

      // Incentivize call with FEI rewards
      _incentivize();
    }

    // =======================================================================
    // Internal functions
    // =======================================================================

    /// @notice incentivize a call with {swapIncentiveAmount} FEI rewards
    function _incentivize() internal ifMinterSelf {
        fei().mint(msg.sender, swapIncentiveAmount);
    }

    /// @notice see external function getNextAmountSpent()
    function _getExpectedAmountIn() internal view returns (uint256) {
      uint256 balance = ERC20(tokenSpent).balanceOf(address(this));
      require(balance != 0, "PCVSwapperUniswap: no tokenSpent left.");
      return Math.min(maxSpentPerSwap, balance);
    }

    /// @notice see external function getNextAmountReceived()
    function _getExpectedAmountOut(uint256 amountIn) internal view returns (uint256) {
      // Get pair reserves
      (uint256 _token0, uint256 _token1, ) = pair.getReserves();
      (uint256 tokenSpentReserves, uint256 tokenReceivedReserves) =
          pair.token0() == tokenSpent
              ? (_token0, _token1)
              : (_token1, _token0);

      // Prepare swap
      uint256 amountOut = UniswapV2Library.getAmountOut(
        amountIn,
        tokenSpentReserves,
        tokenReceivedReserves
      );

      return amountOut;
    }

    /// @notice see external function getNextAmountReceivedThreshold()
    function _getMinimumAcceptableAmountOut(uint256 amountIn) internal view returns (uint256) {
      Decimal.D256 memory twap = readOracle();
      if (invertOraclePrice) {
        twap = invert(twap);
      }
      Decimal.D256 memory oracleAmountOut = twap.mul(amountIn);
      Decimal.D256 memory maxSlippage = Decimal.ratio(BASIS_POINTS_GRANULARITY - maximumSlippageBasisPoints, BASIS_POINTS_GRANULARITY);
      (uint256 decimalNormalizer, bool normalizerDirection) = _getDecimalNormalizer();
      Decimal.D256 memory oraclePriceMinusSlippage;
      if (normalizerDirection) {
        oraclePriceMinusSlippage = maxSlippage.mul(oracleAmountOut).div(decimalNormalizer);
      } else {
        oraclePriceMinusSlippage = maxSlippage.mul(oracleAmountOut).mul(decimalNormalizer);
      }
      return oraclePriceMinusSlippage.asUint256();
    }

    /// @notice see external function getDecimalNormalizer()
    function _getDecimalNormalizer() internal view returns (uint256, bool) {
      uint8 decimalsTokenSpent = ERC20(tokenSpent).decimals();
      uint8 decimalsTokenReceived = ERC20(tokenReceived).decimals();

      uint256 n;
      bool direction;
      if (decimalsTokenSpent >= decimalsTokenReceived) {
        direction = true;
        n = uint256(10)**(decimalsTokenSpent - decimalsTokenReceived);
      } else {
        direction = false;
        n = uint256(10)**(decimalsTokenReceived - decimalsTokenSpent);
      }
      return (n, direction);
    }
}
