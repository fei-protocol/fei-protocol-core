pragma solidity ^0.8.4;

import "./StakingTokenWrapper.sol";

/// @notice contract to bulk harvest multiple Staking Token Wrappers in a single transaction
/// stateless contract with no storage and can only call harvest on the STW's
contract STWBulkHarvest {
    function bulkHarvest(StakingTokenWrapper[] calldata stw) external {
        for (uint256 i = 0; i < stw.length; i++) {
            stw[i].harvest();
        }
    }
}
