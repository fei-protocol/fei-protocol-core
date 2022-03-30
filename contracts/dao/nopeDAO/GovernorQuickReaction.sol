// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";

/**
 * @dev Extension of {Governor} for quick reaction, whereby a proposal
 *      is executed immediately once Quorum is reached.
 */
abstract contract GovernorQuickReaction is GovernorCountingSimple {
    /// @notice Override state to achieve early execution
    function state(uint256 proposalId)
        public
        view
        virtual
        override
        returns (ProposalState)
    {
        ProposalState status = super.state(proposalId);

        // Check if proposal is marked as Active.
        // If so, check if quorum has been reached and vote is successful
        //   - if so, mark as Succeeded
        // If quorum and vote are not achieved, but proposal is active just return
        if (status == ProposalState.Active) {
            if (_quorumReached(proposalId) && _voteSucceeded(proposalId)) {
                return ProposalState.Succeeded;
            }
        }
        return status;
    }
}
