pragma solidity ^0.8.0;

import "./TribalChief.sol";
import "./RewardsDistributorAdmin.sol";
import "../refs/CoreRef.sol";
import "../external/rari/IRewardsDistributor.sol";

contract AutoRewardsDistributor is CoreRef {
    RewardsDistributorAdmin public rewardsDistributorAdmin;
    TribalChief public tribalChief;
    address public cTokenAddress;
    bool public isBorrowIncentivized;
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
        uint256 compSpeed = tribePerBlock * totalAllocPoints / allocPoints;
        // call out to the rewards distributor admin and set the comp supply/borrow speed to the actual current value
        return isBorrowIncentivized 
            ? rewardsDistributorAdmin._setCompBorrowSpeed(cTokenAddress, compSpeed)
            : rewardsDistributorAdmin._setCompSupplySpeed(cTokenAddress, compSpeed);
    }

    function setRewardsDistributorAdmin(RewardsDistributorAdmin _rewardsDistributorAdmin) external onlyGovernorOrAdmin {
        rewardsDistributorAdmin = _rewardsDistributorAdmin;
    }
}
