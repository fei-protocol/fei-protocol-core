pragma solidity ^0.8.0;

import "./TribalChiefSyncV2.sol";

/**
    @title TribalChiefSyncExtension supports multiple auto-reward-distributors
    @author joeysantoro

    @notice Include the autoRewardsDistributors with the TribalChiefSyncV2 permissionless functions. 
    The TribalChiefSyncExtension will sync the autoRewardsDistributors after completing the main sync
 */
contract TribalChiefSyncExtension {
    TribalChiefSyncV2 public immutable tribalChiefSync;

    constructor(TribalChiefSyncV2 _tribalChiefSync) {
        tribalChiefSync = _tribalChiefSync;
    }

    modifier update(IAutoRewardsDistributor[] calldata distributors) {
        _;
        unchecked {
            for (uint256 i = 0; i < distributors.length; i++) {
                distributors[i].setAutoRewardsDistribution();
            }
        }
    }

    /// @notice Sync a rewards rate change automatically using pre-approved map
    function autoDecreaseRewards(
        IAutoRewardsDistributor[] calldata distributors
    ) external update(distributors) {
        tribalChiefSync.autoDecreaseRewards();
    }

    /// @notice Sync a rewards rate change
    function decreaseRewards(
        uint256 tribePerBlock,
        bytes32 salt,
        IAutoRewardsDistributor[] calldata distributors
    ) external update(distributors) {
        tribalChiefSync.decreaseRewards(tribePerBlock, salt);
    }

    /// @notice Sync a pool addition
    function addPool(
        uint120 allocPoint,
        address stakedToken,
        address rewarder,
        TribalChiefSyncV2.RewardData[] calldata rewardData,
        bytes32 salt,
        IAutoRewardsDistributor[] calldata distributors
    ) external update(distributors) {
        tribalChiefSync.addPool(
            allocPoint,
            stakedToken,
            rewarder,
            rewardData,
            salt
        );
    }

    /// @notice Sync a pool set action
    function setPool(
        uint256 pid,
        uint120 allocPoint,
        IRewarder rewarder,
        bool overwrite,
        bytes32 salt,
        IAutoRewardsDistributor[] calldata distributors
    ) external update(distributors) {
        tribalChiefSync.setPool(pid, allocPoint, rewarder, overwrite, salt);
    }

    /// @notice Sync a pool reset rewards action
    function resetPool(
        uint256 pid,
        bytes32 salt,
        IAutoRewardsDistributor[] calldata distributors
    ) external update(distributors) {
        tribalChiefSync.resetPool(pid, salt);
    }
}
