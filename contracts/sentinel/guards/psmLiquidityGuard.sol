// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../IGuard.sol";

contract PSMLiquidityGuard is IGuard {
    // Hardcoded addresses to check
    // Or address to use as lens to look up what to check

    function check() external pure override returns (bool) {
        // logic here to determine if the any of the fuse pool oracles are illiquid
        // we could check just one fuse pool, or many
    }

    function getProtecActions()
        external
        pure
        override
        returns (
            address[] memory targets,
            bytes[] memory datas,
            uint256[] memory values
        )
    {
        // Grab
        // logic here to compute and output the actions to take
        // this could involve pausing a single pool
        // this could involve rugging everything
        // whatever we want to do
        // eg fusePoolAdmin.disableBorrowing(Pool19);
    }
}
