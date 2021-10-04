pragma solidity ^0.8.0;

import "./../staking/ITribalChief.sol";
import "../refs/CoreRef.sol";
import "./IRewardsDistributorAdmin.sol";

/// @notice Controller Contract to set tribe per block in Rewards Distributor Admin on Rari
contract AutoRewardsDistributor is CoreRef {
    /// @notice rewards distributor admin contract
    IRewardsDistributorAdmin public rewardsDistributorAdmin;
    /// @notice tribal chief contract
    ITribalChief public immutable tribalChief;
    /// @notice address of the CToken this contract controls rewards for
    address public immutable cTokenAddress;
    /// @notice boolean which decides the action to incentivize
    bool public immutable isBorrowIncentivized;
    /// @notice reward index on tribal chief to grab this staked token wrapper's index
    uint256 public immutable tribalChiefRewardIndex;

    event SpeedChanged(uint256 newSpeed);
    event RewardsDistributorAdminChanged(IRewardsDistributorAdmin oldRewardsDistributorAdmin, IRewardsDistributorAdmin newRewardsDistributorAdmin);

    /// @notice constructor function
    /// @param coreAddress address of core contract
    /// @param _rewardsDistributorAdmin address rewards distributor admin contract
    /// @param _isBorrowIncentivized boolean to incentivize borrow or supply, but not both
    /// @param _tribalChiefRewardIndex uint of index for this contract's rewards in tribalchief
    /// @param _cTokenAddress address of ctoken contract
    /// @param _tribalChief address of tribalchief contract
    constructor(
        address coreAddress,
        IRewardsDistributorAdmin _rewardsDistributorAdmin,
        ITribalChief _tribalChief,
        uint256 _tribalChiefRewardIndex,
        address _cTokenAddress,
        bool _isBorrowIncentivized
    ) CoreRef(coreAddress) {
        isBorrowIncentivized = _isBorrowIncentivized;
        cTokenAddress = _cTokenAddress;
        tribalChiefRewardIndex = _tribalChiefRewardIndex;
        rewardsDistributorAdmin = _rewardsDistributorAdmin;
        tribalChief = _tribalChief;
    }

    /// @notice helper function that gets all needed state from the TribalChief contract
    /// based on this state, it then calculates what the compSpeed should be.
    /// Call the TribalChief and grab the current allocation points for the stakedTokenWrapper,
    /// get the total allocation points in the TribalChief,
    /// get the amount of tribe being distributed on a per block basis in the TribalChief.
    /// With those variables we can calculate what the compspeed should be.
    function _deriveRequiredCompSpeed() internal view returns (uint256 compSpeed) {
        (,,, uint120 allocPoints,) = tribalChief.poolInfo(tribalChiefRewardIndex);
        uint256 totalAllocPoints = tribalChief.totalAllocPoint();
        uint256 tribePerBlock = tribalChief.tribePerBlock();

        /// @notice if total allocation points are equal to 0, then set compSpeed to 0
        if (totalAllocPoints == 0) {
            compSpeed = 0;
        } else {
            compSpeed = (tribePerBlock * allocPoints) / totalAllocPoints;
        }
    }

    /// @notice function to get the new comp speed and figure out if an update is needed
    /// @return newCompSpeed the newly calculated compspeed based on comp borrow/supply speed
    /// and allocation points in the TribalChief
    /// @return updateNeeded boolean indicating whether the new compSpeed is equal to the existing compSpeed
    function getNewRewardSpeed() public view returns (uint256 newCompSpeed, bool updateNeeded) {
        newCompSpeed = _deriveRequiredCompSpeed();
        uint256 actualCompSpeed;

        if (isBorrowIncentivized) {
            actualCompSpeed = rewardsDistributorAdmin.compBorrowSpeeds(cTokenAddress);
        } else {
            actualCompSpeed = rewardsDistributorAdmin.compSupplySpeeds(cTokenAddress);
        }

        /// if actual comp speed is not equal to the newly calculated comp speed,
        /// then an update is needed
        if (actualCompSpeed != newCompSpeed) {
            updateNeeded = true;
        }
    }

    /// @notice function to automatically set the rewards speed on the RewardsDistributor contract
    /// through the RewardsDistributorAdmin
    function setAutoRewardsDistribution() external whenNotPaused {
        (uint256 compSpeed, bool updateNeeded) = getNewRewardSpeed();
        require(updateNeeded, "AutoRewardsDistributor: update not needed");

        /// @notice call out to the rewards distributor admin and set the comp supply/borrow speed to the current value
        if (isBorrowIncentivized) {
            rewardsDistributorAdmin._setCompBorrowSpeed(cTokenAddress, compSpeed);
        } else {
            rewardsDistributorAdmin._setCompSupplySpeed(cTokenAddress, compSpeed);
        }
        emit SpeedChanged(compSpeed);
    }

    /// @notice API to point to a new rewards distributor admin contract
    /// @param _newRewardsDistributorAdmin the address of the new RewardsDistributorAdmin contract
    function setRewardsDistributorAdmin(
        IRewardsDistributorAdmin _newRewardsDistributorAdmin
    ) external onlyGovernorOrAdmin {
        IRewardsDistributorAdmin oldRewardsDistributorAdmin = rewardsDistributorAdmin;
        rewardsDistributorAdmin = _newRewardsDistributorAdmin;
        emit RewardsDistributorAdminChanged(oldRewardsDistributorAdmin, _newRewardsDistributorAdmin);
    }
}
