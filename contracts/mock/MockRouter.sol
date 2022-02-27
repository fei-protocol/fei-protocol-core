// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../external/Decimal.sol";
import "./IMockUniswapV2PairLiquidity.sol";

contract MockRouter {
    using SafeMath for uint256;
    using Decimal for Decimal.D256;

    IMockUniswapV2PairLiquidity private PAIR;
    address public WETH;

    constructor(address pair) {
        PAIR = IMockUniswapV2PairLiquidity(pair);
    }

    uint256 private constant LIQUIDITY_INCREMENT = 10000;

    uint256 private amountMinThreshold;

    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountToken0Min,
        uint256,
        address to,
        uint256
    )
        external
        payable
        returns (
            uint256 amountToken,
            uint256 amountETH,
            uint256 liquidity
        )
    {
        address pair = address(PAIR);
        checkAmountMin(amountToken0Min);

        amountToken = amountTokenDesired;
        amountETH = msg.value;
        liquidity = LIQUIDITY_INCREMENT;
        (uint112 reserves0, uint112 reserves1, ) = PAIR.getReserves();
        IERC20(token).transferFrom(to, pair, amountToken);
        PAIR.mintAmount{value: amountETH}(to, LIQUIDITY_INCREMENT);
        uint112 newReserve0 = uint112(reserves0) + uint112(amountETH);
        uint112 newReserve1 = uint112(reserves1) + uint112(amountToken);
        PAIR.setReserves(newReserve0, newReserve1);
    }

    function checkAmountMin(uint256 amount) public view {
        require(
            amountMinThreshold == 0 || amountMinThreshold > amount,
            "amount liquidity revert"
        );
    }

    function setAmountMin(uint256 amount) public {
        amountMinThreshold = amount;
    }

    function addLiquidity(
        address token0,
        address token1,
        uint256 amountToken0Desired,
        uint256 amountToken1Desired,
        uint256 amountToken0Min,
        uint256,
        address to,
        uint256
    )
        external
        returns (
            uint256,
            uint256,
            uint256 liquidity
        )
    {
        address pair = address(PAIR);
        checkAmountMin(amountToken0Min);

        liquidity = LIQUIDITY_INCREMENT;

        IERC20(token0).transferFrom(to, pair, amountToken0Desired);
        IERC20(token1).transferFrom(to, pair, amountToken1Desired);

        PAIR.mintAmount(to, LIQUIDITY_INCREMENT);

        (uint112 reserves0, uint112 reserves1, ) = PAIR.getReserves();

        uint112 newReserve0 = uint112(reserves0) + uint112(amountToken0Desired);
        uint112 newReserve1 = uint112(reserves1) + uint112(amountToken1Desired);
        PAIR.setReserves(newReserve0, newReserve1);

        return (0, 0, liquidity);
    }

    function setWETH(address weth) public {
        WETH = weth;
    }

    function removeLiquidity(
        address,
        address,
        uint256 liquidity,
        uint256 amountToken0Min,
        uint256,
        address to,
        uint256
    ) external returns (uint256 amountFei, uint256 amountToken) {
        checkAmountMin(amountToken0Min);

        Decimal.D256 memory percentWithdrawal = Decimal.ratio(
            liquidity,
            PAIR.balanceOf(to)
        );
        Decimal.D256 memory ratio = ratioOwned(to);
        (amountFei, amountToken) = PAIR.burnToken(
            to,
            ratio.mul(percentWithdrawal)
        );

        (uint112 reserves0, uint112 reserves1, ) = PAIR.getReserves();
        uint112 newReserve0 = uint112(reserves0) - uint112(amountFei);
        uint112 newReserve1 = uint112(reserves1) - uint112(amountToken);

        PAIR.setReserves(newReserve0, newReserve1);
        transferLiquidity(liquidity);
    }

    function transferLiquidity(uint256 liquidity) internal {
        PAIR.transferFrom(msg.sender, address(PAIR), liquidity); // send liquidity to pair
    }

    function ratioOwned(address to) public view returns (Decimal.D256 memory) {
        uint256 balance = PAIR.balanceOf(to);
        uint256 total = PAIR.totalSupply();
        return Decimal.ratio(balance, total);
    }
}
