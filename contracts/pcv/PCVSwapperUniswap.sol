pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IPCVSwapper.sol";
import "../refs/UniRef.sol";
import "../utils/Timed.sol";
import "../external/UniswapV2Library.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IWETH.sol";

/// @title implementation for PCV Swapper that swaps ERC20 tokens on Uniswap
/// @author eswak
contract PCVSwapperUniswap is IPCVSwapper, UniRef, Timed {
    using SafeERC20 for ERC20;
    using Decimal for Decimal.D256;
    using SafeMathCopy for uint256;

    /// @notice the token to spend on swap (outbound)
    address private tokenSpent;
    /// @notice the token to receive on swap (inbound)
    address private tokenReceived;
    /// @notice the address that will receive the inbound tokens
    address private tokenReceivingAddress;
    /// @notice the maximum amount of tokens to buy (0 = unlimited)
    uint256 public tokenBuyLimit = 0;
    /// @notice the maximum amount of tokens to spend on every swap
    uint256 public maxSpentPerSwap;
    /// @notice should we use (1 / oraclePrice) instead of oraclePrice ?
    bool public invertOraclePrice;
    /// @notice the maximum amount of slippage vs oracle price
    uint256 public maximumSlippageBasisPoints = 300; // default 3%
    uint256 public constant BASIS_POINTS_GRANULARITY = 10_000;

    constructor(
        address _core,
        address _pair,
        address _router,
        address _oracle,
        uint256 _swapFrequency,
        address _tokenSpent,
        address _tokenReceived,
        address _tokenReceivingAddress,
        uint256 _maxSpentPerSwap,
        bool _invertOraclePrice
    ) public UniRef(_core, _pair, _router, _oracle) Timed(_swapFrequency) {
        tokenSpent = _tokenSpent;
        tokenReceived = _tokenReceived;
        tokenReceivingAddress = _tokenReceivingAddress;
        maxSpentPerSwap = _maxSpentPerSwap;
        invertOraclePrice = _invertOraclePrice;

        emit UpdateTokenSpent(_tokenSpent);
        emit UpdateTokenReceived(_tokenReceived);

        // start timer
        _initTimed();
    }

    /// @notice All received ETH is wrapped to WETH
    receive() external payable {
      IWETH weth = IWETH(router.WETH());
      weth.deposit{value: msg.value}();
    }

    // =======================================================================
    // IPCVSwapper interface override
    // =======================================================================

    /// @notice withdraw ETH from the contract
    /// @param to address to send ETH
    /// @param amountOut amount of ETH to send
    function withdrawETH(address payable to, uint256 amountOut) external override onlyPCVController {
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

    /// @notice Sets the token to spend
    /// @param _tokenSpent the address of the token to spend
    function setTokenSpent(address _tokenSpent) external override onlyGovernor {
        tokenSpent = _tokenSpent;
        emit UpdateTokenSpent(_tokenSpent);
    }

    /// @notice Sets the token to receive
    /// @param _tokenReceived the address of the token to receive
    function setTokenReceived(address _tokenReceived) external override onlyGovernor {
      tokenReceived = _tokenReceived;
      emit UpdateTokenReceived(_tokenReceived);
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

    /// @notice Sets the maximum amount of tokens to buy
    /// @param _tokenBuyLimit the amount of tokens above which swaps will revert
    function setTokenBuyLimit(uint256 _tokenBuyLimit) external onlyGovernor {
      tokenBuyLimit = _tokenBuyLimit;
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
    // Getters
    // =======================================================================

    /// @notice Get the token to spend
    /// @return The address of the token to spend
    function getTokenSpent() external view override returns (address) {
      return tokenSpent;
    }

    /// @notice Get the token to receive
    /// @return The address of the token to receive
    function getTokenReceived() external view override returns (address) {
      return tokenReceived;
    }

    /// @notice Get the address receiving the inbound swapped tokens
    /// @return The address receiving tokens
    function getReceivingAddress() external view override returns (address) {
      return tokenReceivingAddress;
    }

    /// @notice Get the minimum time between swaps
    /// @return the time between swaps
    function getSwapFrequency() external view returns (uint256) {
      return duration;
    }

    /// @notice Get the current oracle price used for maximum slippage backstop
    /// @return the current oracle price
    function getOraclePrice() external view returns (uint256) {
      (Decimal.D256 memory twap,) = oracle.read();
      return twap.asUint256();
    }

    /// @notice Get the expected number of token to be spent on next swap
    /// @return the number of tokens about to be spent
    function getNextAmountSpent() external view returns (uint256) {
      return _getExpectedAmountIn();
    }

    /// @notice Get the expected number of token to be received on next swap
    /// @return the number of tokens about to be received
    function getNextAmountReceived() external view returns (uint256) {
      return _getExpectedAmountOut(_getExpectedAmountIn());
    }

    /// @notice Get the minimum number of tokens to receive on next swap (based
    ///     on oracle price), under which the swap will revert.
    /// @return the minimum number of tokens to be received on next swap
    function getNextAmountReceivedThreshold() external view returns (uint256) {
      return _getMinimumAcceptableAmountOut(_getExpectedAmountIn());
    }

    /// @notice Get the decimal normalizer between tokenSpent and tokenReceived
    ///     e.g. if tokenSpent has 18 decimals and tokenReceived has 6 decimals,
    //      this function will return 1e12.
    /// @return the decimal normalizer number.
    /// @return a boolean to indicate the normalizer direction (does tokenSpent
    ///     has more decimals than tokenReceived, or the other way around?).
    function getDecimalNormalizer() external view returns (uint256, bool) {
      return _getDecimalNormalizer();
    }

    // =======================================================================
    // External functions
    // =======================================================================

    /// @notice Swap tokenSpent for tokenReceived
    function swap() external override afterTime whenNotPaused {
      if (tokenBuyLimit != 0) {
        require(ERC20(tokenReceived).balanceOf(tokenReceivingAddress) < tokenBuyLimit, "PCVSwapperUniswap: tokenBuyLimit reached.");
      }

      uint256 amountIn = _getExpectedAmountIn();
      uint256 amountOut = _getExpectedAmountOut(amountIn);
      uint minimumAcceptableAmountOut = _getMinimumAcceptableAmountOut(amountIn);

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
    }

    // =======================================================================
    // Internal functions
    // =======================================================================

    /// @notice see external function getNextAmountSpent()
    function _getExpectedAmountIn() internal view returns (uint256) {
      uint256 balance = ERC20(tokenSpent).balanceOf(address(this));
      require(balance != 0, "PCVSwapperUniswap: no tokenSpent left.");
      return Math.min(maxSpentPerSwap, balance);
    }

    /// @notice see external function getNextAmountReceived()
    function _getExpectedAmountOut(uint256 amountIn) internal view returns (uint256) {
      // Get pair reserves
      (uint256 _token0, uint256 _token1) = getReserves();
      (uint256 tokenSpentReserves, uint256 tokenReceivedReserves) =
          pair.token0() == tokenSpent
              ? (_token0, _token1)
              : (_token1, _token0);

      // Prepare swap
      uint256 amountOut = UniswapV2Library.getAmountOut(
        amountIn,
        tokenReceivedReserves,
        tokenSpentReserves
      );

      return amountOut;
    }

    /// @notice see external function getNextAmountReceivedThreshold()
    function _getMinimumAcceptableAmountOut(uint256 amountIn) internal view returns (uint256) {
      (Decimal.D256 memory twap, bool oracleValid) = oracle.read();
      require(oracleValid, "PCVSwapperUniswap: invalid oracle.");
      Decimal.D256 memory oracleAmountOut;
      if (invertOraclePrice) {
        oracleAmountOut = Decimal.from(amountIn).div(twap);
      } else {
        oracleAmountOut = twap.mul(amountIn);
      }
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
        n = Decimal.from(10).pow(decimalsTokenSpent - decimalsTokenReceived).asUint256();
      } else {
        direction = false;
        n = Decimal.from(10).pow(decimalsTokenReceived - decimalsTokenSpent).asUint256();
      }
      return (n, direction);
    }
}
