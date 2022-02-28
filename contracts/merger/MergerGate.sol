//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../dao/governor/GovernorAlpha.sol";

/** 
 @title Merger Gate
 @author Joey Santoro
 @notice a gate to make sure the FeiRari Merger proposal has executed on Rari side before executing Fei Side
*/
contract MergerGate {
    event OnePlusOneEqualsThree(string note);

    /// @notice the Rari DAO address
    /// @dev Rari uses Governor Bravo not alpha, but the relevant interface is identical
    GovernorAlpha public constant rgtGovernor =
        GovernorAlpha(0x91d9c2b5cF81D55a5f2Ecc0fC84E62f9cd2ceFd6);

    uint256 public constant PROPOSAL_NUMBER = 9;

    /// @notice ensures Rari proposal 9 has executed
    /// @dev uses MakerDAO variable naming conventions for obvious reasons: https://github.com/makerdao/dss/issues/28
    function floop() external {
        require(
            rgtGovernor.state(PROPOSAL_NUMBER) ==
                GovernorAlpha.ProposalState.Executed,
            "rip"
        );
        emit OnePlusOneEqualsThree("May the sun never set on the Tribe");
    }
}
