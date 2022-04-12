// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

interface IStablePhantomPoolFactory {
    function create(
        string memory name,
        string memory symbol,
        address[] memory tokens,
        uint256 amplificationParameter,
        address[] memory rateProviders,
        uint256[] memory tokenRateCacheDurations,
        uint256 swapFeePercentage,
        address owner
    ) external returns (address);
}
