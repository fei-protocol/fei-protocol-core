// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "../external/Decimal.sol";

interface IMockUniswapV2PairLiquidity is IUniswapV2Pair {
    function burnEth(address to, Decimal.D256 calldata ratio)
        external
        returns (uint256 amountEth, uint256 amount1);

    function burnToken(address to, Decimal.D256 calldata ratio)
        external
        returns (uint256 amount0, uint256 amount1);

    function mintAmount(address to, uint256 _liquidity) external payable;

    function setReserves(uint112 newReserve0, uint112 newReserve1) external;
}
