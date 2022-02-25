// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";

/// @title UniRef interface
/// @author Fei Protocol
interface IUniRef {
    // ----------- Events -----------

    event PairUpdate(address indexed oldPair, address indexed newPair);

    // ----------- Governor only state changing api -----------

    function setPair(address newPair) external;

    // ----------- Getters -----------

    function pair() external view returns (IUniswapV2Pair);

    function token() external view returns (address);

    function getReserves()
        external
        view
        returns (uint256 feiReserves, uint256 tokenReserves);
}
