pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../external/Decimal.sol";
import "./IMockUniswapV2PairLiquidity.sol";

contract MockRouter {
    using SafeMath for uint256;
    using Decimal for Decimal.D256;

    IMockUniswapV2PairLiquidity private PAIR;
    address public WETH;

    constructor(address pair) public {
        PAIR = IMockUniswapV2PairLiquidity(pair);
    }

    uint256 private totalLiquidity;
    uint256 private constant LIQUIDITY_INCREMENT = 10000;

    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity) {
        address pair = address(PAIR);
        amountToken = amountTokenDesired;
        amountETH = msg.value;
        liquidity = LIQUIDITY_INCREMENT;
        (uint112 reserves0, uint112 reserves1, ) = PAIR.getReserves();
        IERC20(token).transferFrom(to, pair, amountToken);
        PAIR.mintAmount{value: amountETH}(to, LIQUIDITY_INCREMENT);
        totalLiquidity += LIQUIDITY_INCREMENT;
        uint112 newReserve0 = uint112(reserves0) + uint112(amountETH);
        uint112 newReserve1 = uint112(reserves1) + uint112(amountToken);
        PAIR.setReserves(newReserve0, newReserve1);
    }

    function addLiquidity(
        address token0,
        address token1,
        uint amountToken0Desired,
        uint amountToken1Desired,
        uint amountToken0Min,
        uint amountToken1Min,
        address to,
        uint deadline
    ) external returns (uint amountToken0, uint amountToken1, uint liquidity) {
        address pair = address(PAIR);

        liquidity = LIQUIDITY_INCREMENT;

        IERC20(token0).transferFrom(to, pair, amountToken0Desired);
        IERC20(token1).transferFrom(to, pair, amountToken1Desired);

        PAIR.mintAmount(to, LIQUIDITY_INCREMENT);
    }

    function setWETH(address weth) public {
        WETH = weth;
    }

    function removeLiquidityETH(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external returns (uint amountToken, uint amountETH) {

        Decimal.D256 memory percentWithdrawal = Decimal.ratio(liquidity, totalLiquidity);
        Decimal.D256 memory ratio = ratioOwned(to);
        (amountETH, amountToken) = PAIR.burnEth(to, ratio.mul(percentWithdrawal));

        (uint112 reserves0, uint112 reserves1, ) = PAIR.getReserves();
        uint112 newReserve0 = uint112(reserves0) - uint112(amountETH);
        uint112 newReserve1 = uint112(reserves1) - uint112(amountToken);

        PAIR.setReserves(newReserve0, newReserve1);
        transferLiquidity(liquidity);
    }

    function transferLiquidity(uint liquidity) internal {
        PAIR.transferFrom(msg.sender, address(PAIR), liquidity); // send liquidity to pair

    }

    function ratioOwned(address to) public view returns (Decimal.D256 memory) {   
        uint256 balance = PAIR.balanceOf(to);
        uint256 total = PAIR.totalSupply();
        return Decimal.ratio(balance, total);
    }
}
