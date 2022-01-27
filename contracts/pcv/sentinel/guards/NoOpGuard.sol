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

interface IPauseable {
    function pause() external;
}

/**
 * This condition checks the spot price of ETH on Uniswap vs the
 * reported price of ETH on chainlink. If the deviation is greater than
 * 1%, it will allow the caller to pause the ETH PSM (and provide the calldata to do so)
 */
contract NoOpGuard is IGuard {
    address constant private ZERO = address(0x0);

    function check() 
        external 
        view 
        override 
        returns (bool) 
    {
        return true;
    }

    function getProtecActions() 
        external 
        pure 
        override 
        returns (address[] memory targets, bytes[] memory datas) 
    {
        targets = new address[](1);
        datas = new bytes[](1);

        targets[0] = ZERO;
        datas[0] = bytes("");

        return (targets, datas);
    }
}