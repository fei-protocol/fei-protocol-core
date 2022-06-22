// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./MockCoreRef.sol";
import "../metagov/utils/VoteEscrowTokenManager.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockVoteEscrowTokenManager is VoteEscrowTokenManager, MockCoreRef {
    constructor(
        address core,
        address liquidToken,
        address veToken,
        uint256 maxTime
    ) MockCoreRef(core) VoteEscrowTokenManager(IERC20(liquidToken), IVeToken(veToken), maxTime) {}
}
