pragma solidity ^0.6.0;

import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IWETH.sol";
import "@uniswap/lib/contracts/libraries/TransferHelper.sol";
import "./IUniswapSingleEthRouter.sol";

/// @title A Uniswap Router for token/ETH swaps
/// @author Fei Protocol
contract UniswapSingleEthRouter is IUniswapSingleEthRouter {
    // solhint-disable-next-line var-name-mixedcase
    IWETH public immutable WETH;

    // solhint-disable-next-line var-name-mixedcase
    IUniswapV2Pair public immutable PAIR;

    constructor(address pair, address weth) public {
        PAIR = IUniswapV2Pair(pair);
        WETH = IWETH(weth);
    }

    receive() external payable {
        assert(msg.sender == address(WETH)); // only accept ETH via fallback from the WETH contract
    }

    modifier ensure(uint256 deadline) {
        // solhint-disable-next-line not-rely-on-time
        require(deadline >= block.timestamp, "UniswapSingleEthRouter: EXPIRED");
        _;
    }

    function _getReserves()
        internal
        view
        returns (
            uint256 reservesETH,
            uint256 reservesOther,
            bool isETH0
        )
    {
        (uint256 reserves0, uint256 reserves1, ) = PAIR.getReserves();
        isETH0 = PAIR.token0() == address(WETH);
        return
            isETH0
                ? (reserves0, reserves1, isETH0)
                : (reserves1, reserves0, isETH0);
    }

    /// @notice swap ETH for tokens with some protections
    /// @param amountOutMin minimum tokens received
    /// @param to address to send tokens
    /// @param deadline block timestamp after which trade is invalid
    /// @return amountOut the amount of tokens received
    function swapExactETHForTokens(
        uint256 amountOutMin,
        address to,
        uint256 deadline
    ) public payable override ensure(deadline) returns (uint256 amountOut) {
        (uint256 reservesETH, uint256 reservesOther, bool isETH0) =
            _getReserves();

        uint256 amountIn = msg.value;
        amountOut = UniswapV2Library.getAmountOut(
            amountIn,
            reservesETH,
            reservesOther
        );
        require(
            amountOut >= amountOutMin,
            "UniswapSingleEthRouter: INSUFFICIENT_OUTPUT_AMOUNT"
        );
        IWETH(WETH).deposit{value: amountIn}();
        assert(IWETH(WETH).transfer(address(PAIR), amountIn));

        (uint256 amount0Out, uint256 amount1Out) =
            isETH0 ? (uint256(0), amountOut) : (amountOut, uint256(0));
        PAIR.swap(amount0Out, amount1Out, to, new bytes(0));
    }

    /// @notice swap tokens for ETH with some protections
    /// @param amountIn amount of tokens to sell
    /// @param amountOutMin minimum ETH received
    /// @param to address to send ETH
    /// @param deadline block timestamp after which trade is invalid
    /// @return amountOut the amount of ETH received
    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address to,
        uint256 deadline
    ) public override ensure(deadline) returns (uint256 amountOut) {
        (uint256 reservesETH, uint256 reservesOther, bool isETH0) =
            _getReserves();
        amountOut = UniswapV2Library.getAmountOut(
            amountIn,
            reservesOther,
            reservesETH
        );

        require(
            amountOut >= amountOutMin,
            "UniswapSingleEthRouter: INSUFFICIENT_OUTPUT_AMOUNT"
        );

        address token = isETH0 ? PAIR.token1() : PAIR.token0();
        TransferHelper.safeTransferFrom(
            token,
            msg.sender,
            address(PAIR),
            amountIn
        );

        (uint256 amount0Out, uint256 amount1Out) =
            isETH0 ? (amountOut, uint256(0)) : (uint256(0), amountOut);
        PAIR.swap(amount0Out, amount1Out, address(this), new bytes(0));

        IWETH(WETH).withdraw(amountOut);

        TransferHelper.safeTransferETH(to, amountOut);
    }
}
