// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

/// @title a Reserve Stabilizer interface
/// @author Fei Protocol
interface IReserveStabilizer {

    // ----------- Events -----------
    event FeiExchange(address indexed to, uint256 feiAmountIn, uint256 amountOut);

    event UsdPerFeiRateUpdate(uint256 basisPoints);

    // ----------- State changing api -----------

    function exchangeFei(uint256 feiAmount) external returns (uint256);

    // ----------- Governor only state changing api -----------

    function setUsdPerFeiRate(uint256 exchangeRateBasisPoints) external;

    // ----------- Getters -----------

    function usdPerFeiBasisPoints() external view returns (uint256);

    function getAmountOut(uint256 amountIn) external view returns (uint256);
}
