// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

// Ref: https://github.com/backstop-protocol/dev/blob/main/packages/contracts/contracts/StabilityPool.sol
interface IStabilityPool {
    function getCompoundedLUSDDeposit(address holder)
        external
        view
        returns (uint256 lusdValue);

    function getDepositorETHGain(address holder)
        external
        view
        returns (uint256 ethValue);
}
