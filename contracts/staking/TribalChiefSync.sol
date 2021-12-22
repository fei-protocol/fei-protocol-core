pragma solidity ^0.8.0;

import "./ITribalChief.sol";

interface IAutoRewardsDistributor {
    function setAutoRewardsDistribution() external;
}

interface ITimelock {
    function execute(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) external;
}

/**
    @title TribalChief Synchronize contract
    This contract is able to keep the tribalChief and autoRewardsDistributor in sync when either:
    1. adding pools or 
    2. updating block rewards

    It needs the EXECUTOR role on the optimistic timelock, so it can atomically trigger the 3 actions
 */
contract TribalChiefSync {
    ITribalChief public immutable tribalChief;
    IAutoRewardsDistributor public immutable autoRewardsDistributor;
    ITimelock public immutable timelock;

    // TribalChief struct
    struct RewardData {
        uint128 lockLength;
        uint128 rewardMultiplier;
    }

    constructor(
        ITribalChief _tribalChief,
        IAutoRewardsDistributor _autoRewardsDistributor,
        ITimelock _timelock
    ) {
        tribalChief = _tribalChief;
        autoRewardsDistributor = _autoRewardsDistributor;
        timelock = _timelock;
    }

    /// @notice Before an action, mass update all pools, after sync the autoRewardsDistributor
    modifier update {
        uint256 numPools = tribalChief.numPools();
        uint256[] memory pids = new uint256[](numPools);
        for (uint256 i = 0; i < numPools; i++) {
            pids[i] = i;
        }
        tribalChief.massUpdatePools(pids);
        _;
        autoRewardsDistributor.setAutoRewardsDistribution();
    }

    /// @notice Sync a rewards rate change
    function decreaseRewards(uint256 tribePerBlock, bytes32 salt) external update {
        bytes memory data = abi.encodeWithSelector(
            tribalChief.updateBlockReward.selector, 
            tribePerBlock
        );
        timelock.execute(
            address(tribalChief), 
            0, 
            data, 
            bytes32(0), 
            salt
        );
    }

    /// @notice Sync a pool addition
    function addPool(
        uint120 allocPoint, 
        address stakedToken, 
        address rewarder, 
        RewardData[] memory rewardData, 
        bytes32 salt
    ) external update {
        bytes memory data = abi.encodeWithSelector(
            tribalChief.add.selector, 
            allocPoint,
            stakedToken,
            rewarder,
            rewardData
        );
        timelock.execute(
            address(tribalChief), 
            0, 
            data, 
            bytes32(0), 
            salt
        );
    }

    /// @notice Sync a pool set action
    function setPool(
        uint256 pid,
        uint120 allocPoint,
        IRewarder rewarder,
        bool overwrite,
        bytes32 salt
    ) external update {
        bytes memory data = abi.encodeWithSelector(
            tribalChief.set.selector,
            pid,
            allocPoint,
            rewarder,
            overwrite
        );
        timelock.execute(
            address(tribalChief), 
            0, 
            data, 
            bytes32(0), 
            salt
        );
    }

    /// @notice Sync a pool reset rewards action
    function resetPool(
        uint256 pid,
        bytes32 salt
    ) external update {
        bytes memory data = abi.encodeWithSelector(
            tribalChief.resetRewards.selector,
            pid
        );
        timelock.execute(
            address(tribalChief), 
            0, 
            data, 
            bytes32(0), 
            salt
        );
    }
}
