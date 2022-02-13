// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

interface IUniswapWrapper {
  function calculatePrice(
    address pool,
    uint32 secondsAgo,
    address inputToken,
    address outputToken,
    uint8 inputTokenDecimals,
    uint8 outputTokenDecimals
  ) external view returns (uint256);

  function getObservationCardinality(address pool) external view returns (uint16);
}