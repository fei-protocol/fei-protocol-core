// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IVotiumBribe {
    // Deposit bribe
    function depositBribe(
        address _token,
        uint256 _amount,
        bytes32 _proposal,
        uint256 _choiceIndex
    ) external;

    // admin function
    function initiateProposal(
        bytes32 _proposal,
        uint256 _deadline,
        uint256 _maxIndex
    ) external;
}
