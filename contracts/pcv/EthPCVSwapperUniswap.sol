pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IPCVSwapper.sol";
import "../refs/UniRef.sol";
import "../utils/Timed.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../external/UniswapV2Library.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IWETH.sol";

/// @title implementation for PCV Swapper that swaps ETH for ERC20 tokens on Uniswap
/// @author eswak
contract EthPCVSwapperUniswap is IPCVSwapper, UniRef, Timed {
    using Decimal for Decimal.D256;
    using SafeMathCopy for uint256;

    /// @notice the token to swap ETH for
    address public tokenReceived;
    /// @notice the maximum amount of tokens to buy
    uint256 public tokenBuyLimit;
    /// @notice the maximum amount of ether to spend on every swap
    uint256 public maxEthSpentPerSwap;
    /// @notice the maximum amount of slippage vs oracle price
    uint256 public maximumSlippage = 300; // default 3%
    uint256 public constant SLIPPAGE_GRANULARITY = 10000;

    constructor(
        address _core,
        address _pair,
        address _router,
        address _oracle,
        uint256 _swapFrequency,
        address _tokenReceived,
        uint256 _tokenBuyLimit,
        uint256 _maxEthSpentPerSwap
    ) public UniRef(_core, _pair, _router, _oracle) Timed(_swapFrequency) {
        tokenReceived = _tokenReceived;
        tokenBuyLimit = _tokenBuyLimit;
        maxEthSpentPerSwap = _maxEthSpentPerSwap;

        emit UpdateTokenSpent(router.WETH());
        emit UpdateTokenReceived(_tokenReceived);

        // start timer
        _initTimed();
    }

    receive() external payable {}

    /// @notice withdraw ETH from the reserves
    /// @param to address to send ETH
    /// @param amountOut amount of ETH to send
    function withdrawETH(address payable to, uint256 amountOut) external override onlyPCVController {
        Address.sendValue(to, amountOut);
        emit WithdrawETH(msg.sender, to, amountOut);
    }

    /// @notice withdraw ERC20 from the reserves
    /// @param to address destination of the ERC2°
    /// @param token address of the ERC20 to send
    /// @param amount amount of ERC20 to send
    function withdrawERC20(address to, address token, uint256 amount) external override onlyPCVController {
        require(IERC20(token).transfer(to, amount), "EthPCVSwapperUniswap: transferERC20 failed");
        emit WithdrawERC20(msg.sender, to, token, amount);
    }

    /// @notice Sets the token to spend
    /// @param _tokenSpent the address of the token to spend
    function setTokenSpent(address _tokenSpent) external override onlyGovernor {
        require(_tokenSpent == router.WETH(), "EthPCVSwapperUniswap: can only spend ETH");
    }

    /// @notice Sets the token to receive
    /// @param _tokenReceived the address of the token to receive
    function setTokenReceived(address _tokenReceived) external override onlyGovernor {
      tokenReceived = _tokenReceived;
      emit UpdateTokenReceived(_tokenReceived);
    }

    /// @notice Get the token to spend
    /// @return The address of the token to spend
    function getTokenSpent() external view override returns (address) {
      return router.WETH();
    }

    /// @notice Get the token to receive
    /// @return The address of the token to receive
    function getTokenReceived() external view override returns (address) {
      return tokenReceived;
    }

    function swap() external override afterTime whenNotPaused {
      require(address(this).balance > 0, "EthPCVSwapperUniswap: no ETH left");
      require(IERC20(tokenReceived).balanceOf(address(this)) < tokenBuyLimit, "EthPCVSwapperUniswap: cannot buy more");

      // Get pair reserves
      IWETH weth = IWETH(router.WETH());
      (uint256 _token0, uint256 _token1) = getReserves();
      (uint256 ethReserves, uint256 tokenReserves) =
          pair.token0() == address(weth)
              ? (_token0, _token1)
              : (_token1, _token0);

      // Prepare swap
      uint256 balance = address(this).balance;
      uint256 amount = Math.min(maxEthSpentPerSwap, balance);

      uint256 amountOut =
          UniswapV2Library.getAmountOut(amount, ethReserves, tokenReserves);

      // Check spot price vs oracle price discounted by max slippage
      // E.g. for a max slippage of 3% :
      // spot price must be >= oraclePrice * (1 - 3%)
      (Decimal.D256 memory twap, bool oracleValid) = oracle.read();
      require(oracleValid, "EthPCVSwapperUniswap: invalid oracle");
      uint256 oracleAmountOut = twap.mul(amount).asUint256();
      Decimal.D256 memory maxSlippage = Decimal.ratio(SLIPPAGE_GRANULARITY - maximumSlippage, SLIPPAGE_GRANULARITY);
      Decimal.D256 memory oraclePriceMinusSlippage = maxSlippage.mul(oracleAmountOut);
      require(Decimal.lessThanOrEqualTo(oraclePriceMinusSlippage, Decimal.from(amountOut)), "EthPCVSwapperUniswap: slippage too high");

      // Reset timer
      _initTimed();

      // Perform swap
      weth.deposit{value: amount}();
      assert(weth.transfer(address(pair), amount));

      (uint256 amount0Out, uint256 amount1Out) =
          pair.token0() == address(weth)
              ? (uint256(0), amountOut)
              : (amountOut, uint256(0));
      pair.swap(amount0Out, amount1Out, address(this), new bytes(0));

      // Emit event
      emit Swap(
        msg.sender,
        router.WETH(),
        tokenReceived,
        amount,
        amountOut
      );
    }
}
