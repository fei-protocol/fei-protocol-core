pragma solidity ^0.8.0;

import "./TribalChief.sol";
import "./RewardsDistributorAdmin.sol";
import "../refs/CoreRef.sol";
import "../external/rari/IRewardsDistributor.sol";

/// Controller Contract to set tribe per block in Rewards Distributor Admin on Rari
contract AutoRewardsDistributor is CoreRef {
    /// rewards distributor admin address
    RewardsDistributorAdmin public rewardsDistributorAdmin;
    /// tribal chief contract address
    TribalChief public tribalChief;
    /// address of the CToken this contract controls rewards for
    address public cTokenAddress;
    /// boolean which decides the action to incentivize
    bool public isBorrowIncentivized;
    /// reward index on tribal chief to grab this staked token wrapper's index
    uint256 public tribalChiefRewardIndex;

    constructor(
        address coreAddress,
        RewardsDistributorAdmin _rewardsDistributorAdmin,
        bool _isBorrowIncentivized,
        uint256 _tribalChiefRewardIndex,
        address _cTokenAddress,
        TribalChief _tribalChief
    ) CoreRef(coreAddress) {
        isBorrowIncentivized = _isBorrowIncentivized;
        rewardsDistributorAdmin = _rewardsDistributorAdmin;
        tribalChief = _tribalChief;
        tribalChiefRewardIndex = _tribalChiefRewardIndex;
        cTokenAddress = _cTokenAddress;
    }

    /// @notice function to automatically set the rewards speed on the RewardsDistributor contract
    /// through the RewardsDistributorAdmin
    function setAutoRewardsDistribution() external whenNotPaused {
        // call out to TC, grab the current allocation points for the stakedTokenWrapper
        (,,, uint120 allocPoints,) = tribalChief.poolInfo(tribalChiefRewardIndex);
        //   grab the total allocation points
        uint256 totalAllocPoints = tribalChief.totalAllocPoint();
        //   grab the tribePerBlock
        uint256 tribePerBlock = tribalChief.tribePerBlock();
        // Calculate the amount per block that the Rari rewards distributor is receiving from the TC
        uint256 compSpeed = (tribePerBlock * totalAllocPoints) / allocPoints;
        // call out to the rewards distributor admin and set the comp supply/borrow speed to the actual current value
        return isBorrowIncentivized 
            ? rewardsDistributorAdmin._setCompBorrowSpeed(cTokenAddress, compSpeed)
            : rewardsDistributorAdmin._setCompSupplySpeed(cTokenAddress, compSpeed);
    }

    /// @notice API to point to a new rewards distribution address
    /// @param _rewardsDistributorAdmin the address of the RewardsDistributorAdmin contract
    function setRewardsDistributorAdmin(
        RewardsDistributorAdmin _rewardsDistributorAdmin
    ) external onlyGovernorOrAdmin {
        rewardsDistributorAdmin = _rewardsDistributorAdmin;
    }
}
