// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

/// @title a PCV Deposit interface
/// @author Fei Protocol
interface IUniswapPCVDeposit {
    // ----------- Events -----------

    event MaxBasisPointsFromPegLPUpdate(
        uint256 oldMaxBasisPointsFromPegLP,
        uint256 newMaxBasisPointsFromPegLP
    );

    // ----------- Governor only state changing api -----------

    function setMaxBasisPointsFromPegLP(uint256 amount) external;

    // ----------- Getters -----------

    function router() external view returns (IUniswapV2Router02);

    function liquidityOwned() external view returns (uint256);

    function maxBasisPointsFromPegLP() external view returns (uint256);
}
