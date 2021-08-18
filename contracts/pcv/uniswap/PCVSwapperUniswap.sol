// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./IPCVSwapper.sol";
import "../utils/WethPCVDeposit.sol";
import "../../utils/Incentivized.sol";
import "../../refs/OracleRef.sol";
import "../../utils/Timed.sol";
import "../../external/UniswapV2Library.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";

/// @title implementation for PCV Swapper that swaps ERC20 tokens on Uniswap
/// @author eswak
contract PCVSwapperUniswap is IPCVSwapper, WethPCVDeposit, OracleRef, Timed, Incentivized {
    using SafeERC20 for IERC20;
    using Decimal for Decimal.D256;

    // ----------- Events -----------	
    event UpdateMaximumSlippage(uint256 oldMaxSlippage, uint256 newMaximumSlippage);	
    event UpdateMaxSpentPerSwap(uint256 oldMaxSpentPerSwap, uint256 newMaxSpentPerSwap);	

    /// @notice the token to spend on swap (outbound)
    address public immutable override tokenSpent;
    /// @notice the token to receive on swap (inbound)
    address public immutable override tokenReceived;
    /// @notice the address that will receive the inbound tokens
    address public override tokenReceivingAddress;
    /// @notice the maximum amount of tokens to spend on every swap
    uint256 public maxSpentPerSwap;
    /// @notice the maximum amount of slippage vs oracle price
    uint256 public maximumSlippageBasisPoints;
    uint256 public constant BASIS_POINTS_GRANULARITY = 10_000;

    /// @notice Uniswap pair to swap on
    IUniswapV2Pair public immutable pair;

    struct OracleData {
        address _oracle;
        address _backupOracle;
        // invert should be false if the oracle is reported in tokenSpent terms otherwise true
        bool _invertOraclePrice;
        // The decimalsNormalizer should be calculated as tokenSpent.decimals() - tokenReceived.decimals() if invert is false, otherwise reverse order
        int256 _decimalsNormalizer;
    }

    constructor(
        address _core,
        IUniswapV2Pair _pair,
        // solhint-disable-next-line var-name-mixedcase
        OracleData memory oracleData,
        uint256 _swapFrequency,
        address _tokenSpent,
        address _tokenReceived,
        address _tokenReceivingAddress,
        uint256 _maxSpentPerSwap,
        uint256 _maximumSlippageBasisPoints,
        uint256 _swapIncentiveAmount
    ) OracleRef(
      _core, 
      oracleData._oracle, 
      oracleData._backupOracle,
      oracleData._decimalsNormalizer,
      oracleData._invertOraclePrice
    ) Timed(_swapFrequency) Incentivized(_swapIncentiveAmount) {
        require(_pair.token0() == _tokenSpent || _pair.token1() == _tokenSpent, "PCVSwapperUniswap: token spent not in pair");
        require(_pair.token0() == _tokenReceived || _pair.token1() == _tokenReceived, "PCVSwapperUniswap: token received not in pair");
        pair = _pair;
        tokenSpent = _tokenSpent;
        tokenReceived = _tokenReceived;

        tokenReceivingAddress = _tokenReceivingAddress;
        emit UpdateReceivingAddress(address(0), _tokenReceivingAddress);

        maxSpentPerSwap = _maxSpentPerSwap;
        emit UpdateMaxSpentPerSwap(0, _maxSpentPerSwap);

        maximumSlippageBasisPoints = _maximumSlippageBasisPoints;
        emit UpdateMaximumSlippage(0, _maximumSlippageBasisPoints);

        // start timer
        _initTimed();
    }

    // =======================================================================
    // IPCVDeposit interface override
    // =======================================================================

    /// @notice withdraw tokenReceived from the contract
    /// @param to address destination of the ERC20
    /// @param amount quantity of tokenReceived to send
    function withdraw(address to, uint256 amount) external override onlyPCVController {
        withdrawERC20(tokenReceived, to, amount);
    }

    /// @notice Reads the balance of tokenReceived held in the contract
		/// @return held balance of token of tokenReceived
    function balance() external view override returns(uint256) {
      return IERC20(tokenReceived).balanceOf(address(this));
    }

    // =======================================================================
    // IPCVSwapper interface override
    // =======================================================================

    /// @notice Sets the address receiving swap's inbound tokens
    /// @param newTokenReceivingAddress the address that will receive tokens
    function setReceivingAddress(address newTokenReceivingAddress) external override onlyGovernor {
      require(newTokenReceivingAddress != address(0), "PCVSwapperUniswap: zero address");
      address oldTokenReceivingAddress = tokenReceivingAddress;
      tokenReceivingAddress = newTokenReceivingAddress;
      emit UpdateReceivingAddress(oldTokenReceivingAddress, newTokenReceivingAddress);
    }

    // =======================================================================
    // Setters
    // =======================================================================

    /// @notice Sets the maximum slippage vs Oracle price accepted during swaps
    /// @param newMaximumSlippageBasisPoints the maximum slippage expressed in basis points (1/10_000)
    function setMaximumSlippage(uint256 newMaximumSlippageBasisPoints) external onlyGovernor {
        uint256 oldMaxSlippage = maximumSlippageBasisPoints;
        require(newMaximumSlippageBasisPoints <= BASIS_POINTS_GRANULARITY, "PCVSwapperUniswap: Exceeds bp granularity.");
        maximumSlippageBasisPoints = newMaximumSlippageBasisPoints;
        emit UpdateMaximumSlippage(oldMaxSlippage, newMaximumSlippageBasisPoints);
    }

    /// @notice Sets the maximum tokens spent on each swap
    /// @param newMaxSpentPerSwap the maximum number of tokens to be swapped on each call
    function setMaxSpentPerSwap(uint256 newMaxSpentPerSwap) external onlyGovernor {
        uint256 oldMaxSpentPerSwap = maxSpentPerSwap;
        require(newMaxSpentPerSwap != 0, "PCVSwapperUniswap: Cannot swap 0.");
        maxSpentPerSwap = newMaxSpentPerSwap;
        emit UpdateMaxSpentPerSwap(oldMaxSpentPerSwap, newMaxSpentPerSwap);	
    }

    /// @notice sets the minimum time between swaps
		/// @param _duration minimum time between swaps in seconds
    function setSwapFrequency(uint256 _duration) external onlyGovernor {
       _setDuration(_duration);
    }

    // =======================================================================
    // External functions
    // =======================================================================

    /// @notice Swap tokenSpent for tokenReceived
    function swap() external override afterTime whenNotPaused {
	    // Reset timer	
      _initTimed();	
      
      updateOracle();

      uint256 amountIn = _getExpectedAmountIn();
      uint256 amountOut = _getExpectedAmountOut(amountIn);
      uint256 minimumAcceptableAmountOut = _getMinimumAcceptableAmountOut(amountIn);

      // Check spot price vs oracle price discounted by max slippage
      // E.g. for a max slippage of 3%, spot price must be >= 97% oraclePrice
      require(minimumAcceptableAmountOut <= amountOut, "PCVSwapperUniswap: slippage too high.");

      // Perform swap
      IERC20(tokenSpent).safeTransfer(address(pair), amountIn);
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

    function _getExpectedAmountIn() internal view returns (uint256) {
      uint256 amount = IERC20(tokenSpent).balanceOf(address(this));
      require(amount != 0, "PCVSwapperUniswap: no tokenSpent left.");
      return Math.min(maxSpentPerSwap, amount);
    }

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

    function _getMinimumAcceptableAmountOut(uint256 amountIn) internal view returns (uint256) {
      Decimal.D256 memory oraclePrice = readOracle();
      Decimal.D256 memory oracleAmountOut = oraclePrice.mul(amountIn);
      Decimal.D256 memory maxSlippage = Decimal.ratio(BASIS_POINTS_GRANULARITY - maximumSlippageBasisPoints, BASIS_POINTS_GRANULARITY);
      Decimal.D256 memory oraclePriceMinusSlippage = maxSlippage.mul(oracleAmountOut);
      return oraclePriceMinusSlippage.asUint256();
    }
}
