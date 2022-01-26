// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../IGuard.sol";

interface IUniV2Pair {
    function getReserves() external view returns (uint112, uint112, uint32);
}

interface IChainlinkPriceFeed {
    function latestAnswer() external view returns (uint256);
    function decimals() external view returns (uint8);
}

/**
 * This condition checks the spot price of ETH on Uniswap vs the
 * reported price of ETH on chainlink. If the deviation is greater than
 * 1%, it will allow the caller to pause the ETH PSM (and provide the calldata to do so)
 */
contract ETHPSMPriceGuard is IGuard {
    // Hardcoded values here since each condition is approved on its own
    address immutable private chainlinkETHUSDPriceFeed = 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419;
    address immutable private uniV2ETHUSDCPair = 0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc;
    uint256 immutable private allowedDeviationBips = 100; // 1%
    bytes private pauseETHPSMCalldata = "0xDEADBEEF";

    function check() external view override returns (bytes memory) {
        
        (uint112 reserveETH, uint112 reserveUSD,) = IUniV2Pair(uniV2ETHUSDCPair).getReserves();
        uint256 uniSpotPrice = (reserveUSD * 1e18) / reserveETH;

        uint8 decimals = IChainlinkPriceFeed(chainlinkETHUSDPriceFeed).decimals();
        uint256 chainlinkPrice = IChainlinkPriceFeed(chainlinkETHUSDPriceFeed).latestAnswer() * (10 ^ (17-decimals));

        uint256 deviationAmount = chainlinkPrice > uniSpotPrice ? chainlinkPrice - uniSpotPrice : uniSpotPrice - chainlinkPrice;
        uint256 deviationBips;
        
        if (chainlinkPrice >= uniSpotPrice) 
         (deviationAmount * 10000) / chainlinkPrice;

        if (deviationBips > allowedDeviationBips) {
            return (pauseETHPSMCalldata);
        }

        return ("");
    }
}