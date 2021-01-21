pragma solidity ^0.6.0;

import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IWETH.sol";
import "@uniswap/lib/contracts/libraries/TransferHelper.sol";
import "./IUniswapSingleEthRouter.sol";

contract UniswapSingleEthRouter is IUniswapSingleEthRouter {
	IWETH public immutable WETH;
	IUniswapV2Pair public immutable PAIR;

	constructor(
		address pair, 
		address weth
	) public {
        PAIR = IUniswapV2Pair(pair);
		WETH = IWETH(weth);
	}

    receive() external payable {
        assert(msg.sender == address(WETH)); // only accept ETH via fallback from the WETH contract
    }

    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, 'UniswapSingleEthRouter: EXPIRED');
        _;
    }

    function _getReserves() internal view returns(uint reservesETH, uint reservesOther, bool isETH0) {
        (uint reserves0, uint reserves1, ) = PAIR.getReserves();
        isETH0 = PAIR.token0() == address(WETH);
        return isETH0 ? (reserves0, reserves1, isETH0) : (reserves1, reserves0, isETH0);
    }

    function swapExactETHForTokens(uint amountOutMin, address to, uint deadline)
        public
        payable
        override
        ensure(deadline)
        returns (uint amountOut)
    {
        (uint reservesETH, uint reservesOther, bool isETH0) = _getReserves();

        uint amountIn = msg.value;
        amountOut = UniswapV2Library.getAmountOut(amountIn, reservesETH, reservesOther);
        require(amountOut >= amountOutMin, 'UniswapSingleEthRouter: INSUFFICIENT_OUTPUT_AMOUNT');
        IWETH(WETH).deposit{value: amountIn}();
        assert(IWETH(WETH).transfer(address(PAIR), amountIn));

        (uint amount0Out, uint amount1Out) = isETH0 ? (uint(0), amountOut) : (amountOut, uint(0));
        PAIR.swap(amount0Out, amount1Out, to, new bytes(0));
    }

	function swapExactTokensForETH(uint amountIn, uint amountOutMin, address to, uint deadline)
        public
        override
        ensure(deadline)
        returns (uint amountOut)
    {
        (uint reservesETH, uint reservesOther, bool isETH0) = _getReserves();
        amountOut = UniswapV2Library.getAmountOut(amountIn, reservesOther, reservesETH);

        require(amountOut >= amountOutMin, 'UniswapSingleEthRouter: INSUFFICIENT_OUTPUT_AMOUNT');

        address token = isETH0 ? PAIR.token1() : PAIR.token0();
        TransferHelper.safeTransferFrom(
            token, msg.sender, address(PAIR), amountIn
        );

        (uint amount0Out, uint amount1Out) = isETH0 ? (amountOut, uint(0)) : (uint(0), amountOut);
        PAIR.swap(amount0Out, amount1Out, address(this), new bytes(0));

        IWETH(WETH).withdraw(amountOut);

        TransferHelper.safeTransferETH(to, amountOut);
    }
}